import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { getSupabaseServerClient, getSession } from '@/lib/supabase/server';
import ConvexClientProvider from '@/components/providers/ConvexClientProvider';
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
    const { data } = await getSession();
    session = data.session;
  } catch (error) {
    console.error("Error getting session:", error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider initialSession={session}>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen">
                {children}
                <Toaster position="top-center" />
              </div>
            </ThemeProvider>
          </ConvexClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
