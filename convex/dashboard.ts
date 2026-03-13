import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile, requireInstitutionAccess } from "./lib/authorization";

export const getMetrics = query({
  args: { institutionId: v.optional(v.id("institutions")) },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    if (!args.institutionId) {
      if (profile.role !== "super_admin") throw new Error("Not authorized");
      const institutions = await ctx.db.query("institutions").collect();
      const profiles = await ctx.db.query("profiles").collect();
      return {
        totalInstitutions: institutions.length,
        totalUsers: profiles.length,
        totalLibrarians: profiles.filter((p) => p.role === "librarian").length,
        totalStudents: profiles.filter((p) => p.role === "student").length,
        totalAdmins: profiles.filter((p) => p.role === "admin").length,
      };
    }

    requireInstitutionAccess(profile, args.institutionId);

    const books = await ctx.db
      .query("books")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId!),
      )
      .collect();

    const borrowings = await ctx.db
      .query("borrowings")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId!),
      )
      .collect();

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId!),
      )
      .collect();

    const now = Date.now();
    const activeBorrowings = borrowings.filter((b) => b.status === "active");
    const overdueBorrowings = activeBorrowings.filter((b) => b.dueDate < now);
    const totalPenalties = borrowings.reduce(
      (sum, b) => sum + (b.penalty ?? 0),
      0,
    );
    const pendingRequests = requests.filter((r) => r.status === "pending");

    return {
      totalBooks: books.length,
      totalAvailable: books.reduce((sum, b) => sum + b.available, 0),
      borrowedBooks: activeBorrowings.length,
      overdueBooks: overdueBorrowings.length,
      totalPenalties,
      totalRequests: requests.length,
      pendingRequests: pendingRequests.length,
    };
  },
});

export const getStudentStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (profile.role === "student" && profile.userId !== args.userId) {
      throw new Error("Not authorized");
    }

    const borrowings = await ctx.db
      .query("borrowings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    const active = borrowings.filter((b) => b.status === "active");
    const dueSoon = active.filter(
      (b) => b.dueDate <= now + threeDaysMs && b.dueDate >= now,
    );
    const totalFines = borrowings.reduce(
      (sum, b) => sum + (b.penalty ?? 0),
      0,
    );

    return {
      totalBorrowed: active.length,
      dueSoon: dueSoon.length,
      totalFines,
    };
  },
});
