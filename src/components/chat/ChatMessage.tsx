import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

type Message = {
  _id: string;
  content: string;
  authorId: string | null;
  authorName?: string;
  createdAt: number;
};

type ChatMessageProps = {
  message: Message;
  isCurrentUser: boolean;
};

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  const authorName = message.authorName || (isCurrentUser ? 'You' : 'AI');
  const avatarFallback = authorName.charAt(0).toUpperCase();
  
  return (
    <div
      className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] space-y-1`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
        <div
          className={`rounded-lg px-4 py-2 ${
            isCurrentUser
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-muted rounded-tl-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
