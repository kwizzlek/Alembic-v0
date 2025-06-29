'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Welcome to Alembic</h2>
              <p className="text-muted-foreground mb-6">
                Get started by exploring the AI builder to create and manage your AI conversations.
              </p>
              <Button 
                onClick={() => router.push('/builder')}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Go to AI Builder
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
