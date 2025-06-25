"use client";

import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useSupabaseAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}