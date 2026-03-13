import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  requireProfile,
  requireInstitutionAccess,
  canManageBooks,
} from "./lib/authorization";

export const listByInstitution = query({
  args: {
    institutionId: v.id("institutions"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);
    return await ctx.db
      .query("books")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId),
      )
      .paginate(args.paginationOpts);
  },
});

export const search = query({
  args: {
    institutionId: v.id("institutions"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);
    if (!args.searchQuery.trim()) return [];
    return await ctx.db
      .query("books")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.searchQuery).eq("institutionId", args.institutionId),
      )
      .take(20);
  },
});

export const getById = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    authors: v.array(v.string()),
    genres: v.array(v.string()),
    summary: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("Available"),
      v.literal("Borrowed"),
      v.literal("Reserved"),
      v.literal("Maintenance"),
      v.literal("Lost"),
    ),
    available: v.number(),
    total: v.number(),
    publisher: v.optional(v.string()),
    publishDate: v.optional(v.string()),
    language: v.optional(v.string()),
    isbn13: v.optional(v.string()),
    isbn10: v.optional(v.string()),
    coverType: v.optional(
      v.union(v.literal("Hardcover"), v.literal("Paperback")),
    ),
    institutionId: v.id("institutions"),
    libraryId: v.optional(v.id("libraries")),
    pageCount: v.optional(v.number()),
    edition: v.optional(v.string()),
    shelfLocation: v.optional(v.string()),
    condition: v.optional(
      v.union(
        v.literal("New"),
        v.literal("Good"),
        v.literal("Fair"),
        v.literal("Poor"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBooks(profile)) throw new Error("Not authorized to add books");
    requireInstitutionAccess(profile, args.institutionId);
    return await ctx.db.insert("books", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("books"),
    title: v.optional(v.string()),
    authors: v.optional(v.array(v.string())),
    genres: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    status: v.optional(
      v.union(
        v.literal("Available"),
        v.literal("Borrowed"),
        v.literal("Reserved"),
        v.literal("Maintenance"),
        v.literal("Lost"),
      ),
    ),
    available: v.optional(v.number()),
    total: v.optional(v.number()),
    publisher: v.optional(v.string()),
    publishDate: v.optional(v.string()),
    language: v.optional(v.string()),
    isbn13: v.optional(v.string()),
    isbn10: v.optional(v.string()),
    coverType: v.optional(
      v.union(v.literal("Hardcover"), v.literal("Paperback")),
    ),
    libraryId: v.optional(v.id("libraries")),
    pageCount: v.optional(v.number()),
    edition: v.optional(v.string()),
    shelfLocation: v.optional(v.string()),
    condition: v.optional(
      v.union(
        v.literal("New"),
        v.literal("Good"),
        v.literal("Fair"),
        v.literal("Poor"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBooks(profile)) throw new Error("Not authorized to edit books");
    const book = await ctx.db.get(args.id);
    if (!book) throw new Error("Book not found");
    requireInstitutionAccess(profile, book.institutionId);
    const { id, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBooks(profile)) throw new Error("Not authorized to delete books");
    const book = await ctx.db.get(args.id);
    if (!book) throw new Error("Book not found");
    requireInstitutionAccess(profile, book.institutionId);
    await ctx.db.delete(args.id);
  },
});
