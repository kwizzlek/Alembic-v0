import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { getSupabaseServerClient, getSession } from '@/lib/supabase/server';
import ConvexClientProvider from '@/components/ConvexClientProvider';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: "Alembic",
  description: "Document management system",
};

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  let session: Session | null = null;
  
  try {
    const supabase = await getSupabaseServerClient();
    // Use our updated getSession which verifies the user
    const { data } = await getSession();
    session = data.session;
  } catch (error) {
    console.error('Error getting session:', error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider initialSession={session}>
            <ConvexClientProvider>
              <div className="min-h-screen">
                {children}
                <Toaster position="top-center" />
              </div>
            </ConvexClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
