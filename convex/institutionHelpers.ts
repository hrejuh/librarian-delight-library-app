import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createInstitutionWithAdmin = internalMutation({
  args: {
    name: v.string(),
    address: v.string(),
    adminName: v.string(),
    adminEmail: v.string(),
    hashedAdminPassword: v.string(),
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
    const { hashedAdminPassword, adminEmail, adminName, ...institutionFields } =
      args;

    // Check if an account with this email already exists
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", adminEmail),
      )
      .unique();
    if (existingAccount) {
      throw new Error(`An account with email ${adminEmail} already exists`);
    }

    // 1. Create the institution
    const institutionId = await ctx.db.insert("institutions", {
      ...institutionFields,
      adminName,
      adminEmail,
    });

    // 2. Create the admin user
    const userId = await ctx.db.insert("users", {
      name: adminName,
      email: adminEmail,
      emailVerificationTime: Date.now(),
    });

    // 3. Create auth account
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: adminEmail,
      secret: hashedAdminPassword,
    });

    // 4. Create admin profile linked to the institution
    await ctx.db.insert("profiles", {
      userId,
      email: adminEmail,
      name: adminName,
      role: "admin",
      institutionId,
      borrowedBooks: 0,
    });

    return institutionId;
  },
});

export const createUserWithAuth = internalMutation({
  args: {
    email: v.string(),
    hashedPassword: v.string(),
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
    const { hashedPassword, email, name, role, institutionId, libraryId, userType } = args;

    // Check if account already exists
    const existing = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", email),
      )
      .unique();
    if (existing) {
      throw new Error(`An account with email ${email} already exists`);
    }

    // 1. Create user record
    const userId = await ctx.db.insert("users", {
      name: name ?? email,
      email,
      emailVerificationTime: Date.now(),
    });

    // 2. Create auth account
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: email,
      secret: hashedPassword,
    });

    // 3. Create profile
    await ctx.db.insert("profiles", {
      userId,
      email,
      name,
      role,
      institutionId,
      libraryId,
      userType,
      borrowedBooks: 0,
    });

    return userId;
  },
});
