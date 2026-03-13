"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Scrypt } from "lucia";

export const createUser = action({
  args: {
    email: v.string(),
    password: v.string(),
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
    const { password, ...userData } = args;

    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(password);

    return await ctx.runMutation(
      internal.institutionHelpers.createUserWithAuth,
      {
        ...userData,
        hashedPassword,
      },
    );
  },
});
