/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_createUser from "../actions/createUser.js";
import type * as actions_isbnLookup from "../actions/isbnLookup.js";
import type * as auth from "../auth.js";
import type * as authors from "../authors.js";
import type * as bookQueue from "../bookQueue.js";
import type * as books from "../books.js";
import type * as borrowings from "../borrowings.js";
import type * as circulationRules from "../circulationRules.js";
import type * as cronHandlers from "../cronHandlers.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as files from "../files.js";
import type * as fines from "../fines.js";
import type * as genres from "../genres.js";
import type * as http from "../http.js";
import type * as institutionActions from "../institutionActions.js";
import type * as institutionHelpers from "../institutionHelpers.js";
import type * as institutions from "../institutions.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as libraries from "../libraries.js";
import type * as notifications from "../notifications.js";
import type * as requests from "../requests.js";
import type * as seed from "../seed.js";
import type * as seedHelpers from "../seedHelpers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/createUser": typeof actions_createUser;
  "actions/isbnLookup": typeof actions_isbnLookup;
  auth: typeof auth;
  authors: typeof authors;
  bookQueue: typeof bookQueue;
  books: typeof books;
  borrowings: typeof borrowings;
  circulationRules: typeof circulationRules;
  cronHandlers: typeof cronHandlers;
  crons: typeof crons;
  dashboard: typeof dashboard;
  files: typeof files;
  fines: typeof fines;
  genres: typeof genres;
  http: typeof http;
  institutionActions: typeof institutionActions;
  institutionHelpers: typeof institutionHelpers;
  institutions: typeof institutions;
  "lib/authorization": typeof lib_authorization;
  libraries: typeof libraries;
  notifications: typeof notifications;
  requests: typeof requests;
  seed: typeof seed;
  seedHelpers: typeof seedHelpers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
