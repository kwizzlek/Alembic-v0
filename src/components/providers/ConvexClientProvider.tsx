"use client";

import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@/components/auth-provider";
import { ReactNode, useCallback } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * A hook that adapts the `useAuth` hook from our `AuthProvider`
 * to the interface that `ConvexProviderWithAuth` expects.
 */
function useAdaptedAuth() {
  const { loading, session } = useAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!session) {
        return null;
      }
      // Supabase client automatically refreshes the token, so we don't need to
      // implement `forceRefreshToken` logic here. We just return the current token.
      return session.access_token;
    },
    [session]
  );

  return {
    isLoading: loading,
    isAuthenticated: session !== null,
    fetchAccessToken,
  };
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAdaptedAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}