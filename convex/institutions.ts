import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireRole,
  requireInstitutionAccess,
} from "./lib/authorization";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    if (profile.role === "super_admin") {
      return await ctx.db.query("institutions").collect();
    }
    // Non-super-admins see only their own institution
    if (profile.institutionId) {
      const inst = await ctx.db.get(profile.institutionId);
      return inst ? [inst] : [];
    }
    return [];
  },
});

export const getById = query({
  args: { id: v.id("institutions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getOrganizationStructure = query({
  args: { id: v.id("institutions") },
  handler: async (ctx, args) => {
    const institution = await ctx.db.get(args.id);
    if (!institution) return null;
    return {
      organizationStructure: institution.organizationStructure,
      reserveDurationDays: institution.reserveDurationDays,
      loanDurationDays: institution.loanDurationDays,
      lateFinPerDay: institution.lateFinPerDay,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    adminName: v.string(),
    adminEmail: v.string(),
    organizationStructure: v.optional(v.any()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    offDays: v.optional(v.array(v.string())),
    reserveDurationDays: v.optional(v.number()),
    loanDurationDays: v.optional(v.number()),
    lateFinPerDay: v.optional(v.number()),
    rules: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["super_admin"]);
    return await ctx.db.insert("institutions", {
      ...args,
      createdBy: profile.userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("institutions"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    adminName: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
    organizationStructure: v.optional(v.any()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    offDays: v.optional(v.array(v.string())),
    reserveDurationDays: v.optional(v.number()),
    loanDurationDays: v.optional(v.number()),
    lateFinPerDay: v.optional(v.number()),
    rules: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    // Super admin or institution's own admin
    if (profile.role !== "super_admin") {
      requireInstitutionAccess(profile, args.id);
      if (profile.role !== "admin") throw new Error("Not authorized");
    }
    const { id, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("institutions") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["super_admin"]);
    await ctx.db.delete(args.id);
  },
});
