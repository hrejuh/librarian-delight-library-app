import { z } from "zod";

// Book validation schema
export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authors: z.array(z.string()).min(1, "At least one author is required"),
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  summary: z.string().optional(),
  image_url: z.string().url("Invalid image URL").optional(),
  status: z.enum(["Available", "Borrowed"]),
  total: z.number().min(1, "Total must be at least 1"),
  available: z.number().min(0, "Available must be 0 or greater"),
  isbn_13: z.string().optional(),
  isbn_10: z.string().optional(),
  publish_date: z.string().optional(),
  publisher: z.string().optional(),
  cover_type: z.enum(["Hardcover", "Paperback", "E-Book"]),
  language: z.string().min(1, "Language is required"),
});

// Borrowing validation schema
export const borrowingSchema = z.object({
  book_id: z.string().uuid("Invalid book ID"),
  user_id: z.string().uuid("Invalid user ID"),
  institution_id: z.string().uuid("Invalid institution ID"),
  borrow_date: z.string().datetime(),
  due_date: z.string().datetime(),
});

// Request validation schema
export const requestSchema = z.object({
  book_id: z.string().uuid("Invalid book ID"),
  user_id: z.string().uuid("Invalid user ID"),
  institution_id: z.string().uuid("Invalid institution ID"),
  status: z.enum(["pending", "approved", "rejected"]),
  expiration_date: z.string().datetime(),
});

// User validation schema
export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "librarian", "admin", "super_admin"]),
  institution_id: z.string().uuid("Invalid institution ID"),
});

export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => e.message).join(", ")
      };
    }
    return {
      success: false,
      error: "Validation failed"
    };
  }
}; 