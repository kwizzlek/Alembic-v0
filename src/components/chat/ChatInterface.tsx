'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { Doc } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { DocumentLibrary } from './DocumentLibrary';
import { Loader2 } from 'lucide-react';
import { AuthGate } from '../auth/AuthGate';

type Message = {
  _id: Id<'messages'>;
  threadId: Id<'threads'>;
  authorId?: Id<'users'>;
  authorName?: string;
  content: string;
  createdAt: number;
};

type Thread = {
  _id: Id<'threads'>;
  title: string;
  updatedAt: number;
  lastMessage?: string;
  lastMessageAt?: number;
};

interface ChatSidebarProps {
  threads: Thread[];
  selectedThreadId: Id<'threads'> | null;
  onSelectThread: (threadId: Id<'threads'>) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: Id<'threads'>) => void;
}

interface ChatInterfaceProps {
  userId: string;
}

function ChatSidebar({
  threads,
  selectedThreadId,
  onSelectThreadAction,
  onNewThreadAction,
  onDeleteThreadAction,
}: {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThreadAction: (threadId: Id<'threads'>) => void;
  onNewThreadAction: () => void;
  onDeleteThreadAction: (threadId: Id<'threads'>) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Button onClick={onNewThreadAction} className="w-full">
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {threads.map((thread) => (
            <div
              key={thread._id}
              className={`p-2 rounded-md cursor-pointer hover:bg-muted ${
                selectedThreadId === thread._id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectThreadAction(thread._id)}
            >
              <div className="flex justify-between items-center">
                <span className="truncate">{thread.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThreadAction(thread._id);
                  }}
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const { user: authUser } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<Id<'threads'> | null>(null);
  const [channelId, setChannelId] = useState<Id<'channels'> | null>(null);
  const [convexUserId, setConvexUserId] = useState<Id<'users'> | null>(null);
  const getOrCreateUser = useMutation(api.index.getOrCreateUser);
  
  // Get or create the user in Convex when the component mounts
  useEffect(() => {
    const setupUser = async () => {
      if (authUser?.email) {
        try {
          const id = await getOrCreateUser({ name: authUser.email });
          setConvexUserId(id);
        } catch (error) {
          console.error('Error setting up user:', error);
        }
      }
    };
    
    setupUser();
  }, [authUser, getOrCreateUser]);

  // State
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ensureDefaultChannel = useMutation(api.index.ensureDefaultChannel);

  // Get or create the default channel
  useEffect(() => {
    const setupDefaultChannel = async () => {
      try {
        const channelId = await ensureDefaultChannel({});
        if (channelId) {
          setChannelId(channelId);
        }
      } catch (error) {
        console.error('Error setting up default channel:', error);
      }
    };
    
    setupDefaultChannel();
  }, [ensureDefaultChannel]);
  
  // Add diagnostic logging
  console.log('--- Convex Channel ID Debug ---');
  console.log('channelId value:', channelId);
  console.log('typeof channelId:', typeof channelId);

  // Fetch threads for the current channel
  const threadsResult = useQuery(
    api.index.listThreads,
    channelId ? { channelId } : 'skip'
  ) as Thread[] | undefined;
  
  // Fetch messages for the selected thread
  const messagesResult = useQuery(
    api.index.listMessages,
    selectedThreadId ? { threadId: selectedThreadId } : 'skip'
  ) as Message[] | undefined;
  
  // Handle query results safely with proper typing
  const threads: Thread[] = threadsResult || [];
  const messages: Message[] = messagesResult || [];
  const isLoadingMessages = messagesResult === undefined;
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-select first thread if none selected
  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0]._id);
    }
  }, [threads, selectedThreadId]);

  // Mutations
  const createThreadMutation = useMutation(api.index.createThread);
  const deleteThreadMutation = useMutation(api.index.deleteThread);
  const sendMessageMutation = useMutation(api.index.sendMessage);

  // Handle creating a new thread
  const handleNewThread = useCallback(async () => {
    if (!channelId) {
      console.error('No channel ID available');
      return;
    }
    
    try {
      const threadId = await createThreadMutation({ 
        title: 'New Chat',
        channelId
      });
      setSelectedThreadId(threadId);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  }, [createThreadMutation, channelId]);

  // Handle deleting a thread
  const handleDeleteThread = useCallback(async (threadId: Id<'threads'>) => {
    try {
      await deleteThreadMutation({ threadId });
      // If the deleted thread was selected, clear the selection
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }
      // If this was the last thread, ensure we clear the selection
      if (threads.length === 1) {
        setSelectedThreadId(null);
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  }, [deleteThreadMutation, selectedThreadId, threads.length]);

  // Handle sending a message
  const [isSending, setIsSending] = useState(false);
  const [showDocumentLibrary, setShowDocumentLibrary] = useState(true);
  
  // Show toast when document library is toggled
  useEffect(() => {
    if (showDocumentLibrary) {
      toast.success('Document library enabled. You can now upload and manage documents.');
    }
  }, [showDocumentLibrary]);
  
  const handleMessageSent = useCallback(async (content: string) => {
    if (!selectedThreadId) {
      console.error('No thread selected');
      return false;
    }
    
    if (!convexUserId) {
      console.error('User not set up in Convex');
      return false;
    }
    
    try {
      setIsSending(true);
      await sendMessageMutation({
        threadId: selectedThreadId,
        authorId: convexUserId,
        content,
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error message to the user here
      return false;
    } finally {
      setIsSending(false);
    }
  }, [selectedThreadId, sendMessageMutation, convexUserId]);

  // Show loading state while initial data is being fetched
  if (!channelId || threadsResult === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  // Show loading state when messages are being loaded for a thread
  if (selectedThreadId && messagesResult === undefined) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGate>
      <div className="flex h-full">
        {/* Left Sidebar - Threads */}
        <div className="w-64 border-r flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatSidebar
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelectThreadAction={setSelectedThreadId}
              onNewThreadAction={handleNewThread}
              onDeleteThreadAction={handleDeleteThread}
            />
          </div>
          
          {/* Document Library Toggle */}
          <div className="border-t p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setShowDocumentLibrary(!showDocumentLibrary)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {showDocumentLibrary ? 'Hide Documents' : 'Show Documents'}
            </Button>
          </div>
        </div>
        
        {/* Document Library Sidebar */}
        {showDocumentLibrary && channelId && (
          <div className="w-80 border-r">
            <DocumentLibrary channelId={channelId} />
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="flex-1 p-4 overflow-y-auto">
              {!selectedThreadId ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    {threads.length === 0 ? 'No chats yet. Create a new chat to get started!' : 'Select a chat to start messaging'}
                  </p>
                </div>
              ) : messages === undefined ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No messages yet. Send a message to start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message._id}
                    message={{
                      ...message,
                      authorId: message.authorId || '',
                      authorName: message.authorName || 'AI',
                      createdAt: message.createdAt,
                    }}
                    isCurrentUser={message.authorId === userId}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <ChatInput
              threadId={selectedThreadId || ''}
              userId={userId}
              onSendMessageAction={handleMessageSent}
              disabled={!selectedThreadId}
              isSending={isSending}
            />
          </div>
        </div>
      </div>
    </AuthGate>
  )
}
