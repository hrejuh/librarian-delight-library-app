import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireRole,
  requireInstitutionAccess,
} from "./lib/authorization";

export const listByInstitution = query({
  args: { institutionId: v.id("institutions") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);
    return await ctx.db
      .query("circulationRules")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId),
      )
      .collect();
  },
});

export const getByPatronType = query({
  args: {
    institutionId: v.id("institutions"),
    patronType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("circulationRules")
      .withIndex("by_institutionId_patronType", (q) =>
        q
          .eq("institutionId", args.institutionId)
          .eq("patronType", args.patronType),
      )
      .unique();
  },
});

export const upsert = mutation({
  args: {
    institutionId: v.id("institutions"),
    patronType: v.string(),
    maxBooks: v.number(),
    loanDurationDays: v.number(),
    reserveDurationDays: v.number(),
    maxRenewals: v.number(),
    finePerDay: v.number(),
    maxConcurrentHolds: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["admin", "super_admin"]);
    requireInstitutionAccess(profile, args.institutionId);

    const existing = await ctx.db
      .query("circulationRules")
      .withIndex("by_institutionId_patronType", (q) =>
        q
          .eq("institutionId", args.institutionId)
          .eq("patronType", args.patronType),
      )
      .unique();

    if (existing) {
      const { institutionId, patronType, ...updates } = args;
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("circulationRules", args);
    }
  },
});
