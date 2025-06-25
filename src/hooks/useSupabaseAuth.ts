"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

// Initialize the Supabase client once
const supabase = createClient();

export function useSupabaseAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      setIsLoading(false);
    };

    // Run on initial load
    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchAccessToken = useCallback(
    async ({ force_refresh }: { force_refresh?: boolean }) => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting Supabase session:", error);
        return null;
      }

      // This logic can be used by Convex to force a token refresh if needed
      if (force_refresh && data.session) {
        const { data: refreshed_data, error: refresh_error } =
          await supabase.auth.refreshSession();

        if (refresh_error) {
          console.error("Error refreshing Supabase token:", refresh_error.message);
          setIsAuthenticated(false);
          return null;
        }

        return refreshed_data.session?.access_token ?? null;
      }

      return data.session?.access_token ?? null;
    },
    []
  );

  return { isLoading, isAuthenticated, fetchAccessToken };
}