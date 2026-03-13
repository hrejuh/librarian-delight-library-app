import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile, isStaff } from "./lib/authorization";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    if (!isStaff(profile)) throw new Error("Not authorized to upload files");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
