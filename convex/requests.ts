import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireInstitutionAccess,
  canManageBorrowings,
} from "./lib/authorization";

export const listByInstitution = query({
  args: { institutionId: v.id("institutions") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBorrowings(profile)) throw new Error("Not authorized");
    requireInstitutionAccess(profile, args.institutionId);

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId),
      )
      .order("desc")
      .collect();

    const result = [];
    for (const r of requests) {
      const book = await ctx.db.get(r.bookId);
      const requestProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", r.userId))
        .unique();
      result.push({
        ...r,
        book: book
          ? {
              _id: book._id,
              title: book.title,
              authors: book.authors,
              imageUrl: book.imageUrl,
            }
          : null,
        userName: requestProfile?.name ?? requestProfile?.email ?? "Unknown",
        userRole: requestProfile?.role ?? "student",
      });
    }
    return result;
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (profile.role === "student" && profile.userId !== args.userId) {
      throw new Error("Not authorized");
    }

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const result = [];
    for (const r of requests) {
      const book = await ctx.db.get(r.bookId);
      result.push({
        ...r,
        book: book
          ? {
              _id: book._id,
              title: book.title,
              authors: book.authors,
              imageUrl: book.imageUrl,
            }
          : null,
      });
    }
    return result;
  },
});
