'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Thread = {
  _id: string;
  _creationTime: number;
  title: string;
  lastMessage: string;
  lastMessageAt: number;
};

export function ChatSidebar({
  onSelectThread,
  selectedThreadId,
  threads,
}: {
  onSelectThread: (threadId: string) => void;
  selectedThreadId: string | null;
  threads: Thread[];
}) {
  const { toast } = useToast();
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  
  // Mutations
  const createThread = useMutation(api.threads.createThread);
  const deleteThread = useMutation(api.threads.deleteThread);

  const handleCreateThread = async () => {
    try {
      // In a real app, you might want to get the default channel ID from user settings
      const defaultChannelId = (threads?.[0]?.channelId as string) || 'default-channel-id';
      const threadId = await createThread({
        title: 'New Chat',
        channelId: defaultChannelId,
      });
      onSelectThread(threadId);
    } catch (error) {
      console.error('Failed to create thread:', error);
      toast({
        title: 'Error',
        description: 'Failed to create a new chat',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteThread = async () => {
    if (!threadToDelete) return;
    
    try {
      await deleteThread({ threadId: threadToDelete as any });
      if (selectedThreadId === threadToDelete) {
        onSelectThread(threads?.[0]?._id || '');
      }
      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete thread:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the chat',
        variant: 'destructive',
      });
    } finally {
      setThreadToDelete(null);
    }
  };

  if (!threads) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button className="w-full" onClick={handleCreateThread}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {threads.map((thread) => (
            <div
              key={thread._id}
              className={`relative group flex items-center p-2 rounded-md cursor-pointer hover:bg-muted ${
                selectedThreadId === thread._id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectThread(thread._id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{thread.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {thread.lastMessage}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(thread.lastMessageAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setThreadToDelete(thread._id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {threads.length === 0 && (
            <div className="text-center text-sm text-muted-foreground p-4">
              No chats yet. Start a new conversation!
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog
        open={!!threadToDelete}
        onOpenChange={(open) => !open && setThreadToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chat and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThread}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
