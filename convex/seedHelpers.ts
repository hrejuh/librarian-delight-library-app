import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createSuperAdminRecords = internalMutation({
  args: {
    email: v.string(),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if a super admin already exists
    const existingProfiles = await ctx.db.query("profiles").collect();
    const existingSuperAdmin = existingProfiles.find(
      (p) => p.role === "super_admin",
    );
    if (existingSuperAdmin) {
      throw new Error(
        `Super admin already exists with email: ${existingSuperAdmin.email}`,
      );
    }

    // Check if an auth account with this email already exists
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.email),
      )
      .unique();
    if (existingAccount) {
      throw new Error(
        `An account with email ${args.email} already exists`,
      );
    }

    // 1. Create user record
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(),
    });

    // 2. Create auth account (links password provider to user)
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: args.email,
      secret: args.hashedPassword,
    });

    // 3. Create super admin profile
    const profileId = await ctx.db.insert("profiles", {
      userId,
      email: args.email,
      role: "super_admin",
      borrowedBooks: 0,
    });

    return { userId, profileId, email: args.email };
  },
});
