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
 * Get or create a user.
 */
export const getOrCreateUser = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (user) {
      return user._id;
    }
    return await ctx.db.insert("users", { name: args.name });
  },
});

/**
 * List messages for a channel.
 */
export const listMessages = query({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      channelId: v.id("channels"),
      authorId: v.optional(v.id("users")),
      authorName: v.optional(v.string()),
      content: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("asc") // Fetch oldest messages first
      .collect();

    return Promise.all(
      messages.map(async (message) => {
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
 * Send a message to a channel and schedule a response from the AI.
 */
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const user = await ctx.db.get(args.authorId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      content: args.content,
    });
    await ctx.scheduler.runAfter(0, internal.index.generateResponse, {
      channelId: args.channelId,
    });
    return null;
  },
});

export const generateResponse = internalAction({
  args: {
    channelId: v.id("channels"),
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
      const context = await ctx.runQuery(internal.index.loadContext, {
        channelId: args.channelId,
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
        channelId: args.channelId,
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
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);

    const result = [];
    for (const message of messages) {
      if (message.authorId) {
        const user = await ctx.db.get(message.authorId);
        if (!user) {
          throw new Error("User not found");
        }
        result.push({
          role: "user" as const,
          content: message.content,
        });
      } else {
        result.push({ role: "assistant" as const, content: message.content });
      }
    }
    // The API expects messages in chronological order.
    return result.reverse();
  },
});

export const writeAgentResponse = internalMutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      content: args.content,
    });
    return null;
  },
});
