'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AIAssistant() {
  const [channelId, setChannelId] = useState<Id<"channels"> | null>(null);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const createChannel = useMutation(api.index.createChannel);
  const getOrCreateUser = useMutation(api.index.getOrCreateUser);
  const sendMessage = useMutation(api.index.sendMessage);

  const messages = useQuery(api.index.listMessages, channelId ? { channelId } : 'skip');

  useEffect(() => {
    async function setup() {
      const user = await getOrCreateUser({ name: 'User' });
      setUserId(user);

      const channel = await createChannel({ name: 'AI Assistant' });
      setChannelId(channel);
    }
    setup();
  }, [createChannel, getOrCreateUser]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelId || !userId) return;

    await sendMessage({ channelId, authorId: userId, content: newMessage });
    setNewMessage('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages?.map((message) => (
              <div key={message._id} className={`flex items-start gap-3 ${message.authorName === 'AI' ? '' : 'justify-end'}`}>
                {message.authorName === 'AI' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg px-3 py-2 ${message.authorName === 'AI' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                  <p className="text-sm font-medium">{message.authorName}</p>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.authorName !== 'AI' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={!channelId || !userId}
          />
          <Button type="submit" disabled={!newMessage.trim() || !channelId || !userId}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
