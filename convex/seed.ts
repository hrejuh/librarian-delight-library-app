"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Scrypt } from "lucia";

export const seedSuperAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Hash password using same algorithm as Convex Auth Password provider
    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(args.password);

    // Create user, auth account, and profile via internal mutation
    const result = await ctx.runMutation(
      internal.seedHelpers.createSuperAdminRecords,
      {
        email: args.email,
        hashedPassword,
      },
    );

    return result;
  },
});
