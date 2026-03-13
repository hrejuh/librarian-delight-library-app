import { query, mutation } from "./_generated/server";
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
    const fines = await ctx.db
      .query("fines")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId),
      )
      .collect();

    const result = [];
    for (const fine of fines) {
      const userProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", fine.userId))
        .unique();
      const borrowing = await ctx.db.get(fine.borrowingId);
      const book = borrowing ? await ctx.db.get(borrowing.bookId) : null;
      result.push({
        ...fine,
        userName: userProfile?.name ?? userProfile?.email ?? "Unknown",
        bookTitle: book?.title ?? "Unknown",
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
    const fines = await ctx.db
      .query("fines")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const result = [];
    for (const fine of fines) {
      const borrowing = await ctx.db.get(fine.borrowingId);
      const book = borrowing ? await ctx.db.get(borrowing.bookId) : null;
      result.push({
        ...fine,
        bookTitle: book?.title ?? "Unknown",
      });
    }
    return result;
  },
});

export const payFine = mutation({
  args: {
    fineId: v.id("fines"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBorrowings(profile)) throw new Error("Not authorized");

    const fine = await ctx.db.get(args.fineId);
    if (!fine) throw new Error("Fine not found");
    requireInstitutionAccess(profile, fine.institutionId);

    const newPaidAmount = fine.paidAmount + args.amount;
    const newStatus =
      newPaidAmount >= fine.amount ? "paid" : "partial";

    await ctx.db.patch(args.fineId, {
      paidAmount: newPaidAmount,
      status: newStatus as "paid" | "partial",
      paidAt: newStatus === "paid" ? Date.now() : undefined,
    });
  },
});

export const waiveFine = mutation({
  args: {
    fineId: v.id("fines"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBorrowings(profile)) throw new Error("Not authorized");

    const fine = await ctx.db.get(args.fineId);
    if (!fine) throw new Error("Fine not found");
    requireInstitutionAccess(profile, fine.institutionId);

    await ctx.db.patch(args.fineId, {
      status: "waived",
      waivedBy: profile.userId,
      notes: args.notes,
    });
  },
});
