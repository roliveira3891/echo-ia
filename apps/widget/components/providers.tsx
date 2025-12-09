"use client"

import * as React from "react"
import { Provider } from "jotai";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Use placeholder URL during build if not provided
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <Provider>
        {children}
      </Provider>
    </ConvexProvider>
  );
};
