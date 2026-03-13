import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile, isStaff } from "./lib/authorization";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("authors").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!isStaff(profile)) throw new Error("Not authorized");
    const existing = await ctx.db
      .query("authors")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("authors", { name: args.name });
  },
});
