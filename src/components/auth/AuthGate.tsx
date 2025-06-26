import { useConvexAuth } from "convex/react";
import { ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    // This can be a login component or a redirect
    return <div>Please sign in to continue.</div>;
  }

  return <>{children}</>;
}
