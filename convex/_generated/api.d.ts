/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as documentEmbeddings from "../documentEmbeddings.js";
import type * as documents from "../documents.js";
import type * as getThreadInternal from "../getThreadInternal.js";
import type * as index from "../index.js";
import type * as migrations_add_createdAt_to_messages from "../migrations/add_createdAt_to_messages.js";
import type * as migrations_fix_user_schema from "../migrations/fix_user_schema.js";
import type * as threads from "../threads.js";
import type * as utils from "../utils.js";
import type * as workflow from "../workflow.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  documentEmbeddings: typeof documentEmbeddings;
  documents: typeof documents;
  getThreadInternal: typeof getThreadInternal;
  index: typeof index;
  "migrations/add_createdAt_to_messages": typeof migrations_add_createdAt_to_messages;
  "migrations/fix_user_schema": typeof migrations_fix_user_schema;
  threads: typeof threads;
  utils: typeof utils;
  workflow: typeof workflow;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
