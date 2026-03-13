"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Scrypt } from "lucia";

export const createWithAdmin = action({
  args: {
    name: v.string(),
    address: v.string(),
    adminName: v.string(),
    adminEmail: v.string(),
    adminPassword: v.string(),
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
    const { adminPassword, ...institutionData } = args;

    // Hash the admin password
    const scrypt = new Scrypt();
    const hashedPassword = await scrypt.hash(adminPassword);

    // Create institution + admin user in one internal mutation
    return await ctx.runMutation(
      internal.institutionHelpers.createInstitutionWithAdmin,
      {
        ...institutionData,
        hashedAdminPassword: hashedPassword,
      },
    );
  },
});
