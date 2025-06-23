import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            await cookieStore.set({ 
              name, 
              value, 
              ...options,
              httpOnly: options?.httpOnly !== false,
              secure: options?.secure !== false,
              sameSite: options?.sameSite as 'lax' | 'strict' | 'none',
              path: options?.path || '/',
            })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: Pick<CookieOptions, 'path' | 'domain' | 'secure' | 'sameSite'>) {
          try {
            await cookieStore.set({ 
              name, 
              value: '', 
              ...options,
              maxAge: 0,
              path: options?.path || '/',
            })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = await getSupabaseServerClient()
  return await supabase.auth.getSession()
}

export async function getUser() {
  const supabase = await getSupabaseServerClient()
  return await supabase.auth.getUser()
}
