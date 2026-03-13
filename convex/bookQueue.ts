import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile, requireInstitutionAccess } from "./lib/authorization";

export const getQueueInfo = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const queue = await ctx.db
      .query("bookQueue")
      .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
      .collect();

    const waiting = queue.filter((item) => item.status === "waiting");
    return {
      totalInQueue: waiting.length,
      queue: waiting.sort((a, b) => a.position - b.position),
    };
  },
});

export const getMyQueuePosition = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const queue = await ctx.db
      .query("bookQueue")
      .withIndex("by_bookId_status", (q) =>
        q.eq("bookId", args.bookId).eq("status", "waiting"),
      )
      .collect();
    const myEntry = queue.find((item) => item.userId === profile.userId);
    return myEntry ? { position: myEntry.position, entryId: myEntry._id } : null;
  },
});

export const joinQueue = mutation({
  args: {
    bookId: v.id("books"),
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);

    // Check if already in queue
    const existing = await ctx.db
      .query("bookQueue")
      .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
      .collect();
    const alreadyQueued = existing.find(
      (item) => item.bookId === args.bookId && item.status === "waiting",
    );
    if (alreadyQueued) throw new Error("Already in queue for this book");

    // Get current queue length for position
    const currentQueue = await ctx.db
      .query("bookQueue")
      .withIndex("by_bookId_status", (q) =>
        q.eq("bookId", args.bookId).eq("status", "waiting"),
      )
      .collect();

    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    return await ctx.db.insert("bookQueue", {
      bookId: args.bookId,
      userId: profile.userId,
      institutionId: args.institutionId,
      position: currentQueue.length + 1,
      status: "waiting",
      expiresAt,
      createdAt: now,
    });
  },
});

export const leaveQueue = mutation({
  args: { entryId: v.id("bookQueue") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new Error("Queue entry not found");
    if (entry.userId !== profile.userId) throw new Error("Not authorized");

    await ctx.db.patch(args.entryId, { status: "cancelled" });

    // Re-number remaining positions
    const remaining = await ctx.db
      .query("bookQueue")
      .withIndex("by_bookId_status", (q) =>
        q.eq("bookId", entry.bookId).eq("status", "waiting"),
      )
      .collect();
    const sorted = remaining.sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i + 1) {
        await ctx.db.patch(sorted[i]._id, { position: i + 1 });
      }
    }
  },
});
