import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireRole,
  requireInstitutionAccess,
} from "./lib/authorization";

export const listWithInstitution = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    let libraries;
    if (profile.role === "super_admin") {
      libraries = await ctx.db.query("libraries").collect();
    } else if (profile.institutionId) {
      libraries = await ctx.db
        .query("libraries")
        .withIndex("by_institutionId", (q) =>
          q.eq("institutionId", profile.institutionId!),
        )
        .collect();
    } else {
      return [];
    }

    const result = [];
    for (const lib of libraries) {
      const institution = await ctx.db.get(lib.institutionId);
      result.push({
        ...lib,
        institutionName: institution?.name ?? "Unknown",
      });
    }
    return result;
  },
});

export const listByInstitution = query({
  args: { institutionId: v.id("institutions") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);
    return await ctx.db
      .query("libraries")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId),
      )
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("libraries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    institutionId: v.id("institutions"),
    contactNumber: v.optional(v.string()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    daysClosed: v.optional(v.array(v.string())),
    resources: v.optional(v.array(v.string())),
    shelves: v.optional(v.any()),
    managedBy: v.optional(v.array(v.string())),
    userTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["admin", "super_admin"]);
    requireInstitutionAccess(profile, args.institutionId);
    const { contactNumber, ...rest } = args;
    return await ctx.db.insert("libraries", {
      ...rest,
      contactInfo: contactNumber ? { phone: contactNumber } : undefined,
      createdBy: profile.userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("libraries"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    institutionId: v.optional(v.id("institutions")),
    contactNumber: v.optional(v.string()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    daysClosed: v.optional(v.array(v.string())),
    resources: v.optional(v.array(v.string())),
    shelves: v.optional(v.any()),
    managedBy: v.optional(v.array(v.string())),
    userTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["admin", "super_admin"]);
    const lib = await ctx.db.get(args.id);
    if (!lib) throw new Error("Library not found");
    requireInstitutionAccess(profile, lib.institutionId);
    const { id, contactNumber, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    if (contactNumber !== undefined) {
      filtered.contactInfo = { phone: contactNumber };
    }
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("libraries") },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["admin", "super_admin"]);
    const lib = await ctx.db.get(args.id);
    if (!lib) throw new Error("Library not found");
    requireInstitutionAccess(profile, lib.institutionId);
    await ctx.db.delete(args.id);
  },
});
