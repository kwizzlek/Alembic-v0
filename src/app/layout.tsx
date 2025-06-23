import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (error) {
    console.error('Error getting session:', error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider initialSession={session}>
          <div className="min-h-screen bg-background">
            {children}
            <Toaster position="top-center" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
