export type BookStatus = "Available" | "Borrowed" | "Reserved" | "Maintenance" | "Lost";

// Access Level Types
export type AccessLevel = 1 | 2 | 3 | 4;

export const ACCESS_LEVELS = {
  SUPER_ADMIN: 1,
  INSTITUTION_ADMIN: 2,
  LIBRARY_MANAGER: 3,
  USER: 4
} as const;

// Permission Types
export type Permission = 
  // System-wide permissions (Level 1)
  | "manage_system"
  | "manage_all_institutions"
  | "view_system_reports"
  | "manage_system_settings"
  
  // Institution-level permissions (Level 2)
  | "manage_institution"
  | "manage_libraries"
  | "manage_institution_users"
  | "manage_institution_roles"
  | "view_institution_reports"
  | "manage_institution_settings"
  
  // Library-level permissions (Level 3)
  | "manage_library"
  | "manage_books"
  | "manage_borrowings"
  | "manage_reservations"
  | "view_library_reports"
  | "manage_library_settings"
  
  // User-level permissions (Level 4)
  | "borrow_books"
  | "reserve_books"
  | "view_own_history"
  | "view_own_fines";

// Role Interface
export interface Role {
  id: string;
  name: string;
  access_level: AccessLevel;
  description: string;
  permissions: Permission[];
  limits?: {
    max_books: number;
    max_days: number;
    max_reservations: number;
    fine_per_day: number;
    concurrent_borrows: number;
  };
}

// Organization Structure Interface - REPLACED
export interface Level4UserConfig {
  id: string; // For UI key and managing array fields
  name: string;
  max_books: number;
  loan_duration: number;
  reservation_duration: number;
  fine_per_day: number;
}

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
    configs: Level4UserConfig[]; // New array structure
  };
}

// Database types
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Institution {
  id: string;
  name: string;
  address: string;
  admin_name: string;
  admin_email: string;
  admin_password?: string;
  contact_phone?: string;
  organization_structure: Json;
  open_time?: string;
  close_time?: string;
  off_days?: string[];
  created_at: string;
  created_by: string;
  updated_at?: string;
  reserve_duration_days?: number;
  loan_duration_days?: number;
  late_fine_per_day?: number;
  rules?: string;
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  genres: string[];
  summary: string | null;
  image_url: string | null;
  status: BookStatus;
  available: number;
  total: number;
  created_at?: string | null;
  institution_id?: string;
  nextAvailableSlot?: string | null;
  isbn_13?: string | null;
  isbn_10?: string | null;
  publish_date?: string | null;
  publisher?: string | null;
  cover_type?: 'Hardcover' | 'Paperback' | null;
  language?: string;
}

export interface BorrowedBook {
  id: string;
  book: Book;
  borrower_email: string;
  borrower_name?: string;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  penalty: number;
  user_id?: string;
  institution_id?: string;
}

export interface DashboardMetrics {
  totalBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  totalPenalties: number;
  totalRequests: number;
}

export interface Profile {
  id: string;
  email: string;
  role: "student" | "librarian" | "admin" | "super_admin";
  access_level: AccessLevel;
  institution_id: string | null;
  user_type: string | null;
  permissions: string[] | null;
  created_at: string | null;
}

export interface Request {
  id: string;
  book: Book;
  user_id: string;
  user_name: string;
  request_date: string;
  expiration_date: string;
  institution_id?: string;
  available?: number;
  total?: number;
}

export interface InstitutionSettings {
  reserve_duration_days: number;
  loan_duration_days: number;
  late_fine_per_day: number;
  collection_window_hours: number;
  max_books_per_user: number;
  max_active_requests: number;
}
