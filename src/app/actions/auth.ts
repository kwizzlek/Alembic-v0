'use server';

import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function signOut() {
  'use server';
  
  try {
    const cookieStore = await cookies();
    const supabase = await createServerClient();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all auth-related cookies
    const authCookies = ['sb-access-token', 'sb-refresh-token', 'sb-provider-token'];
    
    authCookies.forEach(cookieName => {
      cookieStore.set(cookieName, '', { 
        expires: new Date(0),
        path: '/',
      });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: 'Failed to sign out' };
  }
}
