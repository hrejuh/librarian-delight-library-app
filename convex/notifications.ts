import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/authorization";

export const listByUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    // Users can only see their own notifications
    if (profile.userId !== args.userId && profile.role === "student") {
      throw new Error("Not authorized");
    }
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const unreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (profile.userId !== args.userId && profile.role === "student") {
      throw new Error("Not authorized");
    }
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false),
      )
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== profile.userId) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (profile.userId !== args.userId) throw new Error("Not authorized");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false),
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

// Internal mutation for cron jobs and system notifications
export const createInternal = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("due_reminder"),
      v.literal("overdue"),
      v.literal("hold_ready"),
      v.literal("request_approved"),
      v.literal("request_rejected"),
      v.literal("fine_added"),
      v.literal("queue_position"),
      v.literal("system"),
    ),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});
