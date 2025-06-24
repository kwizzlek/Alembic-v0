'use client';

import { useState, useRef, KeyboardEvent, FormEvent } from 'react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

import type { Id } from 'convex/_generated/dataModel';

interface ChatInputProps {
  threadId: Id<'threads'> | '';
  userId: string;
  onSendMessageAction: (content: string) => Promise<boolean | void> | boolean | void;
  disabled?: boolean;
  isSending?: boolean;
}

type Message = {
  content: string;
  threadId: string;
  userId: string;
  isUser: boolean;
};

export function ChatInput({ threadId, userId, onSendMessageAction, disabled = false, isSending = false }: ChatInputProps & { isSending?: boolean }) {
  const [message, setMessage] = useState('');
  // isSending is now passed as a prop
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = message.trim();
    if (!content || !threadId || isSending) return;

    try {
      const success = await onSendMessageAction(content);
      if (success) {
        setMessage('');
        // Focus the textarea after sending
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('Error in message submission:', error);
      // Error handling is now done in the parent component
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="min-h-[60px] max-h-[200px] w-full resize-none pr-12"
        disabled={isSending}
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-2 bottom-2 h-8 w-8"
        disabled={!message.trim() || isSending || disabled}
        aria-label="Send message"
      >
        {isSending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
