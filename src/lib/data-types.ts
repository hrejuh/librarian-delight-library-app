import type { Doc } from "../../convex/_generated/dataModel";

export type BookStatus = "Available" | "Borrowed" | "Reserved" | "Maintenance" | "Lost";
export type UserRole = "student" | "librarian" | "admin" | "super_admin";

export const ACCESS_LEVELS = {
  SUPER_ADMIN: 1,
  INSTITUTION_ADMIN: 2,
  LIBRARY_MANAGER: 3,
  USER: 4,
} as const;

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface OrganizationStructure {
  level3: {
    libraries: Array<{
      name: string;
      address: string;
      is_default: boolean;
    }>;
    level3_role_names: string[];
  };
  level4: {
    configs: Array<{
      id: string;
      name: string;
      max_books: number;
      loan_duration: number;
      reservation_duration: number;
      fine_per_day: number;
    }>;
  };
}

// Re-export Convex document types for convenience
export type Profile = Doc<"profiles">;
export type Institution = Doc<"institutions">;
export type Book = Doc<"books">;
export type Library = Doc<"libraries">;
export type Borrowing = Doc<"borrowings">;
export type Notification = Doc<"notifications">;
