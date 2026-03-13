import { z } from "zod";

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authors: z.array(z.string()).min(1, "At least one author is required"),
  genres: z.array(z.string()),
  summary: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.string(),
  available: z.number().min(0),
  total: z.number().min(1, "Total copies must be at least 1"),
  publisher: z.string().optional(),
  publishDate: z.string().optional(),
  language: z.string().optional(),
  isbn13: z.string().optional(),
  isbn10: z.string().optional(),
  coverType: z.string().optional(),
});

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map((e) => e.message).join(", ");
  return { success: false, error: errors };
}
