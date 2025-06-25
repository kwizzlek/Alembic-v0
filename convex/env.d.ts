/// <reference types="@convex-dev/../node_modules/.pnpm/@types+node@20.11.19/node_modules/@types/node/globals.d.ts" />

// This file provides TypeScript type definitions for the Convex environment

declare namespace NodeJS {
  interface ProcessEnv {
    // OpenAI
    OPENAI_API_KEY: string;
    
    // Convex
    CONVEX_CLOUD_URL?: string;
    CONVEX_SITE_URL?: string;
    
    // Add other environment variables as needed
    [key: string]: string | undefined;
  }
}

// This makes TypeScript recognize `process` in the global scope
declare const process: {
  env: NodeJS.ProcessEnv;
};
