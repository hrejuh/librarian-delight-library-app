"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

interface BookMetadata {
  title: string;
  authors: string[];
  publisher?: string;
  publishDate?: string;
  isbn13?: string;
  isbn10?: string;
  pageCount?: number;
  summary?: string;
  coverUrl?: string;
  language?: string;
  genres?: string[];
}

async function lookupGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.items || data.items.length === 0) return null;

  const info = data.items[0].volumeInfo;
  const identifiers = info.industryIdentifiers ?? [];
  return {
    title: info.title ?? "",
    authors: info.authors ?? [],
    publisher: info.publisher,
    publishDate: info.publishedDate,
    isbn13: identifiers.find((id: { type: string }) => id.type === "ISBN_13")
      ?.identifier,
    isbn10: identifiers.find((id: { type: string }) => id.type === "ISBN_10")
      ?.identifier,
    pageCount: info.pageCount,
    summary: info.description,
    coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
    language: info.language,
    genres: info.categories ?? [],
  };
}

async function lookupOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
  );
  if (!response.ok) return null;
  const data = await response.json();
  const bookData = data[`ISBN:${isbn}`];
  if (!bookData) return null;

  return {
    title: bookData.title ?? "",
    authors: (bookData.authors ?? []).map((a: { name: string }) => a.name),
    publisher: bookData.publishers?.[0]?.name,
    publishDate: bookData.publish_date,
    isbn13: bookData.identifiers?.isbn_13?.[0],
    isbn10: bookData.identifiers?.isbn_10?.[0],
    pageCount: bookData.number_of_pages,
    summary: bookData.notes,
    coverUrl: bookData.cover?.medium,
    genres: (bookData.subjects ?? []).map((s: { name: string }) => s.name).slice(0, 5),
  };
}

export const lookupISBN = action({
  args: { isbn: v.string() },
  handler: async (_ctx, args) => {
    const isbn = args.isbn.replace(/[-\s]/g, "");
    // Try Google Books first, fall back to Open Library
    const result = await lookupGoogleBooks(isbn);
    if (result) return result;
    const fallback = await lookupOpenLibrary(isbn);
    if (fallback) return fallback;
    return null;
  },
});

export const searchByTitle = action({
  args: { query: v.string() },
  handler: async (_ctx, args) => {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(args.query)}&maxResults=5`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item: { volumeInfo: Record<string, unknown> }) => {
      const info = item.volumeInfo;
      const identifiers = (info.industryIdentifiers as Array<{ type: string; identifier: string }>) ?? [];
      return {
        title: info.title ?? "",
        authors: (info.authors as string[]) ?? [],
        publisher: info.publisher,
        publishDate: info.publishedDate,
        isbn13: identifiers.find((id) => id.type === "ISBN_13")?.identifier,
        isbn10: identifiers.find((id) => id.type === "ISBN_10")?.identifier,
        coverUrl: (info.imageLinks as { thumbnail?: string })?.thumbnail?.replace("http:", "https:"),
      };
    });
  },
});
