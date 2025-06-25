import {
  query,
  mutation,
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";
// getThreadInternal is now imported via internal API
import { Id } from "./_generated/dataModel";

// Re-export workflow and threads for use in other files
export * from "./workflow";
export * from "./threads";

// Test endpoint to check environment variables
export const testEnvVars = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Test environment variables:", {
      API_BASE_URL: process.env.API_BASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***' : 'Not set',
      ALL_ENV_VARS: Object.keys(process.env).filter(k => k.includes('API') || k.includes('CONVEX'))
    });
    return {
      API_BASE_URL: process.env.API_BASE_URL,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      allVars: Object.keys(process.env)
    };
  },
});

/**
 * Create a new channel.
 */
export const createChannel = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("channels"),
  handler: async (ctx, args) => {
    const channelId = await ctx.db.insert("channels", {
      name: args.name,
    });
    return channelId;
  },
});

/**
 * Get or create the default channel.
 */
export const getOrCreateDefaultChannel = query({
  args: {},
  handler: async (ctx) => {
    // Try to find an existing default channel
    const defaultChannel = await ctx.db
      .query("channels")
      .filter((q) => q.eq(q.field("name"), "default"))
      .first();

    if (defaultChannel) {
      return defaultChannel;
    }

    // If no default channel exists, return null
    // (we'll handle creation in a separate mutation to keep queries pure)
    return null;
  },
});

/**
 * Create the default channel if it doesn't exist.
 */
export const ensureDefaultChannel = mutation({
  args: {},
  returns: v.id("channels"),
  handler: async (ctx) => {
    // First, try to find any existing channel
    const anyChannel = await ctx.db.query("channels").first();
    
    if (anyChannel) {
      return anyChannel._id;
    }
    
    // If no channels exist, create a default one
    const channelId = await ctx.db.insert("channels", {
      name: "default",
    });
    
    // Verify the channel was created
    const newChannel = await ctx.db.get(channelId);
    if (!newChannel) {
      throw new Error("Failed to create default channel");
    }
    
    return newChannel._id;
  },
});

/**
 * Get or create a user.
 * @param name - The user's email address
 * @returns The ID of the user
 */
export const getOrCreateUser = mutation({
  args: { 
    name: v.string() 
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Validate email format
    if (!args.name.includes('@')) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
      
    if (existingUser) {
      return existingUser._id;
    }
    
    // Create new user
    try {
      const userId = await ctx.db.insert("users", { 
        name: args.name,
        createdAt: Date.now(),
        lastActiveAt: Date.now()
      });
      return userId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  },
});

/**
 * List all threads in a channel
 */
export const listThreads = query({
  args: {
    channelId: v.union(v.id("channels"), v.literal('skip')),
  },
  returns: v.array(
    v.object({
      _id: v.id("threads"),
      _creationTime: v.optional(v.number()),
      channelId: v.id("channels"),
      title: v.string(),
      updatedAt: v.number(),
      createdAt: v.optional(v.number()),
      messageCount: v.number(),
      preview: v.optional(v.string()),
      lastMessageAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    // Skip if channelId is 'skip'
    if (args.channelId === 'skip') {
      return [];
    }

    // Ensure we have a valid channel ID
    const channelId = args.channelId;
    
    // Ensure the channel exists
    try {
      const channel = await ctx.db.get(channelId);
      if (!channel) {
        console.error('Channel not found:', channelId);
        return [];
      }

      // Get all threads for this channel
      const threadList = await ctx.db
        .query("threads")
        .withIndex("by_channel", (q) => q.eq("channelId", channelId))
        .order("desc")
        .collect();

      if (!threadList || threadList.length === 0) {
        return [];
      }

      // Process each thread to get the last message
      return await Promise.all(
        threadList.map(async (thread) => {
          // Get the most recent message for preview
          const lastMessage = await ctx.db
            .query("messages")
            .filter((q) => 
              q.and(
                q.eq(q.field("threadId"), thread._id),
                q.eq(q.field("channelId"), args.channelId)
              )
            )
            .order("desc")
            .first();

          return {
            ...thread,
            messageCount: 1, // You might want to implement actual count
            preview: lastMessage?.content?.substring(0, 100),
            lastMessageAt: lastMessage?._creationTime,
          };
        })
      );
    } catch (error) {
      console.error('Error listing threads for channel:', channelId, error);
      return [];
    }
  },
});

/**
 * Create a new thread
 */
export const createThread = mutation({
  args: {
    channelId: v.id("channels"),
    title: v.string(),
  },
  returns: v.id("threads"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      channelId: args.channelId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
    return threadId;
  },
});

/**
 * Get thread details
 */
export const getThreadDetails = query({
  args: {
    threadId: v.id("threads"),
  },
  returns: v.object({
    _id: v.id("threads"),
    title: v.string(),
    channelId: v.id("channels"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    return thread;
  },
});

/**
 * List messages in a thread
 */
export const listMessages = query({
  args: {
    threadId: v.id("threads"),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      // threadId is now optional in the schema
      threadId: v.optional(v.id("threads")),
      channelId: v.id("channels"),
      authorId: v.optional(v.id("users")),
      authorName: v.optional(v.string()),
      content: v.string(),
      // createdAt is optional in the schema but we'll provide a default value
      createdAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    // First get all messages in the thread
    let messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("threadId"), args.threadId))
      .order("asc") // Fetch oldest messages first
      .collect();
      
    // For any messages missing createdAt, use _creationTime as a fallback
    const messagesWithCreatedAt = messages.map(message => ({
      ...message,
      // Use _creationTime as a fallback for createdAt
      createdAt: message.createdAt ?? message._creationTime,
    }));

    return Promise.all(
      messagesWithCreatedAt.map(async (message) => {
        if (message.authorId) {
          const author = await ctx.db.get(message.authorId);
          return {
            ...message,
            authorName: author?.name,
          };
        }
        return {
          ...message,
          authorName: "AI",
        };
      })
    );
  },
});

/**
 * Send a message to a thread and schedule a response from the AI.
 */
export const sendMessage = mutation({
  args: {
    threadId: v.id("threads"),
    authorId: v.id("users"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    const user = await ctx.db.get(args.authorId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = Date.now();
    
    // Update thread's updatedAt timestamp
    await ctx.db.patch(thread._id, {
      updatedAt: now,
    });

    // Check if this is the first message in the thread
    const existingMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", q => q.eq("threadId", args.threadId))
      .collect();
    
    const isFirstMessage = existingMessages.length === 0;
    
    // If this is the first message, update the thread title with a truncated version
    if (isFirstMessage && args.content) {
      const truncatedTitle = args.content.length > 50 
        ? args.content.substring(0, 47) + '...' 
        : args.content;
      
      await ctx.db.patch(args.threadId, {
        title: truncatedTitle,
        updatedAt: now,
      });
    }
    
    // Add the message with createdAt set to the current timestamp
    const messageData: any = {
      threadId: args.threadId,
      authorId: args.authorId,
      content: args.content,
      createdAt: now,
    };
    
    // Only include channelId if it exists in the thread
    if (thread.channelId) {
      messageData.channelId = thread.channelId;
    }
    
    await ctx.db.insert("messages", messageData);

    // Schedule AI response
    await ctx.scheduler.runAfter(0, internal.index.generateResponse, {
      threadId: args.threadId,
    });
    return null;
  },
});

export const generateResponse = internalAction({
  args: {
    threadId: v.id("threads"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Debug logging for environment variables
    console.log("Initializing OpenAI client with baseURL:", process.env.API_BASE_URL);
    console.log("Environment variables:", {
      API_BASE_URL: process.env.API_BASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***' : 'Not set'
    });

    // Validate environment variables
    if (!process.env.API_BASE_URL) {
      throw new Error('API_BASE_URL environment variable is not set');
    }
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.API_BASE_URL,
      });

      console.log("Loading conversation context...");
      const thread = await ctx.runQuery(internal.getThreadInternal.default, {
        threadId: args.threadId,
      });
      
      const context = await ctx.runQuery(internal.index.loadContext, {
        threadId: args.threadId,
      });
      console.log("Context loaded, making API call...");

      const response = await openai.chat.completions.create({
        model: "sonar-pro",
        messages: context,
      });
      
      console.log("API response received:", { 
        id: response.id,
        model: response.model,
        usage: response.usage,
        choices: response.choices.length
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }

      console.log("Writing agent response to database...");
      await ctx.runMutation(internal.index.writeAgentResponse, {
        threadId: args.threadId,
        channelId: thread.channelId,
        content,
      });
      
      console.log("Response written successfully");
      return null;
    } catch (error) {
      console.error("Error in generateResponse:", error);
      throw error;
    }
  },
});

export const loadContext = internalQuery({
  args: {
    threadId: v.id("threads"),
  },
  returns: v.array(
    v.object({
      role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc") // Get messages in chronological order
      .collect();

    // Start with a system message
    const result: Array<{role: "system" | "user" | "assistant", content: string}> = [{
      role: "system",
      content: "You are a helpful AI assistant."
    }];

    for (const message of messages) {
      const isUserMessage = !!message.authorId;
      const role = isUserMessage ? "user" : "assistant";
      const lastMessage = result[result.length - 1];
      
      // If the last message has the same role, append to it
      if (lastMessage.role === role) {
        lastMessage.content += "\n" + message.content;
      } else {
        // Otherwise, add a new message
        result.push({
          role,
          content: message.content,
        });
      }
    }
    
    console.log("Formatted messages for API:", JSON.stringify(result, null, 2));
    return result;
  },
});

export const writeAgentResponse = internalMutation({
  args: {
    threadId: v.id("threads"),
    channelId: v.id("channels"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Update thread's updatedAt timestamp
    await ctx.db.patch(args.threadId, {
      updatedAt: now,
    });
    
    // Add the AI response message
    await ctx.db.insert("messages", {
      threadId: args.threadId,
      channelId: args.channelId,
      content: args.content,
      createdAt: now,
    });
    
    return null;
  },
});

// getThreadInternal has been moved to getThreadInternal.ts
