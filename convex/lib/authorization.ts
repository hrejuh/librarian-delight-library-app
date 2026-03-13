import { GenericQueryCtx } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { DataModel, Doc } from "../_generated/dataModel";

type Role = Doc<"profiles">["role"];

/**
 * Require an authenticated user. Throws if not logged in.
 */
export async function requireAuth(
  ctx: GenericQueryCtx<DataModel>,
): Promise<Doc<"users">["_id"]> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/**
 * Require an authenticated user with a profile. Throws if not found.
 */
export async function requireProfile(
  ctx: GenericQueryCtx<DataModel>,
): Promise<Doc<"profiles">> {
  const userId = await requireAuth(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!profile) throw new Error("Profile not found");
  return profile;
}

/**
 * Require one of the specified roles. Throws if user role doesn't match.
 */
export async function requireRole(
  ctx: GenericQueryCtx<DataModel>,
  roles: Role[],
): Promise<Doc<"profiles">> {
  const profile = await requireProfile(ctx);
  if (!roles.includes(profile.role)) {
    throw new Error(`Requires role: ${roles.join(" or ")}`);
  }
  return profile;
}

/**
 * Verify the profile belongs to the given institution (or is super_admin).
 */
export function requireInstitutionAccess(
  profile: Doc<"profiles">,
  institutionId: Doc<"institutions">["_id"],
): void {
  if (profile.role === "super_admin") return;
  if (!profile.institutionId || profile.institutionId !== institutionId) {
    throw new Error("No access to this institution");
  }
}

/**
 * Check if profile can manage books (librarian, admin, super_admin).
 */
export function canManageBooks(profile: Doc<"profiles">): boolean {
  return ["librarian", "admin", "super_admin"].includes(profile.role);
}

/**
 * Check if profile can manage borrowings/requests (librarian, admin, super_admin).
 */
export function canManageBorrowings(profile: Doc<"profiles">): boolean {
  return ["librarian", "admin", "super_admin"].includes(profile.role);
}

/**
 * Check if profile can manage users (admin, super_admin).
 */
export function canManageUsers(
  profile: Doc<"profiles">,
  targetRole?: Role,
): boolean {
  if (profile.role === "super_admin") return true;
  if (profile.role === "admin") {
    // Admins can manage librarians and students, not other admins or super_admins
    return !targetRole || ["librarian", "student"].includes(targetRole);
  }
  return false;
}

/**
 * Check if profile is staff (librarian, admin, super_admin).
 */
export function isStaff(profile: Doc<"profiles">): boolean {
  return ["librarian", "admin", "super_admin"].includes(profile.role);
}
