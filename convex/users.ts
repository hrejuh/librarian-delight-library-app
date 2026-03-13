import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  requireAuth,
  requireProfile,
  requireRole,
  requireInstitutionAccess,
  canManageUsers,
} from "./lib/authorization";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return profile;
  },
});

export const createProfile = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("student"),
      v.literal("librarian"),
      v.literal("admin"),
      v.literal("super_admin"),
    ),
    institutionId: v.optional(v.id("institutions")),
    userType: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) throw new Error("Profile already exists");

    return await ctx.db.insert("profiles", {
      userId,
      email: args.email,
      name: args.name,
      role: args.role,
      institutionId: args.institutionId,
      userType: args.userType,
      borrowedBooks: 0,
    });
  },
});

export const createProfileForUser = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("student"),
      v.literal("librarian"),
      v.literal("admin"),
      v.literal("super_admin"),
    ),
    institutionId: v.optional(v.id("institutions")),
    libraryId: v.optional(v.id("libraries")),
    userType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageUsers(profile, args.role)) {
      throw new Error("Not authorized to create this user");
    }
    if (args.institutionId) {
      requireInstitutionAccess(profile, args.institutionId);
    }

    return await ctx.db.insert("profiles", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      role: args.role,
      institutionId: args.institutionId,
      libraryId: args.libraryId,
      userType: args.userType,
      borrowedBooks: 0,
    });
  },
});

export const getProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const listByInstitution = query({
  args: { institutionId: v.id("institutions") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);
    return await ctx.db
      .query("profiles")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId),
      )
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["super_admin"]);
    return await ctx.db.query("profiles").collect();
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("profiles"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("student"),
        v.literal("librarian"),
        v.literal("admin"),
        v.literal("super_admin"),
      ),
    ),
    institutionId: v.optional(v.id("institutions")),
    libraryId: v.optional(v.id("libraries")),
    userType: v.optional(v.string()),
    maxBooks: v.optional(v.number()),
    loanDurationDays: v.optional(v.number()),
    isWalkIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const callerProfile = await requireProfile(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("Profile not found");

    // Users can update their own name/phone; staff can update others
    const isSelf = callerProfile._id === args.id;
    if (!isSelf && !canManageUsers(callerProfile, args.role)) {
      throw new Error("Not authorized to update this user");
    }

    const { id, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    await ctx.db.patch(id, filtered);
  },
});
