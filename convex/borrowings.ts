import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireProfile,
  requireInstitutionAccess,
  canManageBorrowings,
} from "./lib/authorization";

export const listByInstitution = query({
  args: { institutionId: v.id("institutions") },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);
    const borrowings = await ctx.db
      .query("borrowings")
      .withIndex("by_institutionId", (q) =>
        q.eq("institutionId", args.institutionId),
      )
      .collect();

    const result = [];
    for (const b of borrowings) {
      const book = await ctx.db.get(b.bookId);
      const borrowerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", b.userId))
        .unique();
      result.push({
        ...b,
        book,
        borrowerEmail: borrowerProfile?.email ?? "Unknown",
        borrowerName: borrowerProfile?.name ?? borrowerProfile?.email ?? "Unknown",
      });
    }
    return result;
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerProfile = await requireProfile(ctx);
    if (callerProfile.role === "student" && callerProfile.userId !== args.userId) {
      throw new Error("Not authorized");
    }
    const borrowings = await ctx.db
      .query("borrowings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const result = [];
    for (const b of borrowings) {
      const book = await ctx.db.get(b.bookId);
      result.push({ ...b, book });
    }
    return result;
  },
});

export const listForBorrowedBooksPage = query({
  args: {
    userId: v.id("users"),
    role: v.string(),
    institutionId: v.optional(v.id("institutions")),
    filter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);

    let borrowings;
    if (args.role === "student") {
      borrowings = await ctx.db
        .query("borrowings")
        .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
        .collect();
    } else if (args.institutionId) {
      requireInstitutionAccess(profile, args.institutionId);
      borrowings = await ctx.db
        .query("borrowings")
        .withIndex("by_institutionId", (q) =>
          q.eq("institutionId", args.institutionId),
        )
        .collect();
    } else if (profile.role === "super_admin") {
      borrowings = await ctx.db.query("borrowings").collect();
    } else {
      throw new Error("Not authorized");
    }

    // Apply filter
    if (args.filter === "current") {
      borrowings = borrowings.filter((b) => b.status === "active");
    } else if (args.filter === "returned") {
      borrowings = borrowings.filter((b) => b.status === "returned");
    } else if (args.filter === "overdue") {
      borrowings = borrowings.filter(
        (b) => b.status === "overdue" || (b.status === "active" && b.dueDate < Date.now()),
      );
    }

    // Get institution for penalty calculation
    let lateFinPerDay = 0;
    if (args.institutionId) {
      const institution = await ctx.db.get(args.institutionId);
      lateFinPerDay = institution?.lateFinPerDay ?? 0;
    }

    const result = [];
    for (const b of borrowings) {
      const book = await ctx.db.get(b.bookId);
      const borrowerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", b.userId))
        .unique();

      // Calculate penalty if overdue and not returned
      let penalty = b.penalty ?? 0;
      if (b.status !== "returned" && b.dueDate < Date.now()) {
        const daysOverdue = Math.ceil(
          (Date.now() - b.dueDate) / (1000 * 60 * 60 * 24),
        );
        penalty = daysOverdue * lateFinPerDay;
      }

      result.push({
        _id: b._id,
        bookId: b.bookId,
        userId: b.userId,
        borrowDate: b.borrowDate,
        dueDate: b.dueDate,
        returnDate: b.returnDate,
        penalty,
        penaltyPaid: b.penaltyPaid,
        status: b.status,
        renewCount: b.renewCount,
        institutionId: b.institutionId,
        _creationTime: b._creationTime,
        book: book
          ? {
              _id: book._id,
              title: book.title,
              authors: book.authors,
              genres: book.genres,
              imageUrl: book.imageUrl,
              status: book.status,
            }
          : null,
        borrowerEmail: borrowerProfile?.email ?? "Unknown",
        borrowerName: borrowerProfile?.name ?? borrowerProfile?.email ?? "Unknown",
      });
    }
    return result;
  },
});

export const borrowBook = mutation({
  args: {
    bookId: v.id("books"),
    institutionId: v.id("institutions"),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    requireInstitutionAccess(profile, args.institutionId);

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.available <= 0) throw new Error("Book not available");

    const institution = await ctx.db.get(args.institutionId);
    const reserveDays = institution?.reserveDurationDays ?? 3;

    const now = Date.now();
    const expirationDate = now + reserveDays * 24 * 60 * 60 * 1000;

    const requestId = await ctx.db.insert("requests", {
      bookId: args.bookId,
      userId: profile.userId,
      requestDate: now,
      expirationDate,
      status: "pending",
      institutionId: args.institutionId,
    });

    await ctx.db.patch(args.bookId, {
      available: book.available - 1,
      status: book.available - 1 === 0 ? "Reserved" : book.status,
    });

    return requestId;
  },
});

export const returnBook = mutation({
  args: {
    borrowingId: v.id("borrowings"),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBorrowings(profile)) throw new Error("Not authorized");

    const borrowing = await ctx.db.get(args.borrowingId);
    if (!borrowing) throw new Error("Borrowing not found");
    if (borrowing.returnDate) throw new Error("Book already returned");
    requireInstitutionAccess(profile, borrowing.institutionId);

    const book = await ctx.db.get(borrowing.bookId);
    if (!book) throw new Error("Book not found");

    const now = Date.now();
    let penalty = 0;
    if (now > borrowing.dueDate) {
      const institution = await ctx.db.get(borrowing.institutionId);
      const finePerDay = institution?.lateFinPerDay ?? 0;
      const daysOverdue = Math.ceil(
        (now - borrowing.dueDate) / (1000 * 60 * 60 * 24),
      );
      penalty = daysOverdue * finePerDay;
    }

    await ctx.db.patch(args.borrowingId, {
      returnDate: now,
      penalty,
      status: "returned" as const,
    });

    await ctx.db.patch(borrowing.bookId, {
      available: book.available + 1,
      status: "Available",
    });

    const borrowerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", borrowing.userId))
      .unique();
    if (borrowerProfile && borrowerProfile.borrowedBooks > 0) {
      await ctx.db.patch(borrowerProfile._id, {
        borrowedBooks: borrowerProfile.borrowedBooks - 1,
      });
    }

    // Create fine record if overdue
    if (penalty > 0) {
      await ctx.db.insert("fines", {
        userId: borrowing.userId,
        borrowingId: args.borrowingId,
        amount: penalty,
        paidAmount: 0,
        reason: "overdue",
        status: "unpaid",
        institutionId: borrowing.institutionId,
        createdAt: now,
      });
    }

    // Advance hold queue
    const nextInQueue = await ctx.db
      .query("bookQueue")
      .withIndex("by_bookId_status", (q) =>
        q.eq("bookId", borrowing.bookId).eq("status", "waiting"),
      )
      .first();
    if (nextInQueue) {
      await ctx.db.patch(nextInQueue._id, {
        status: "notified",
        notifiedAt: now,
      });
      await ctx.db.insert("notifications", {
        userId: nextInQueue.userId,
        type: "hold_ready",
        title: "Book Available",
        message: `The book "${book.title}" you were waiting for is now available.`,
        isRead: false,
        createdAt: now,
      });
    }

    return { penalty };
  },
});

export const handleRequestApproval = mutation({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBorrowings(profile)) throw new Error("Not authorized");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "pending") throw new Error("Request is not pending");
    requireInstitutionAccess(profile, request.institutionId);

    if (request.expirationDate < Date.now()) {
      await ctx.db.patch(args.requestId, { status: "expired" });
      const book = await ctx.db.get(request.bookId);
      if (book) {
        await ctx.db.patch(request.bookId, {
          available: book.available + 1,
          status: "Available",
        });
      }
      throw new Error("Request has expired");
    }

    const institution = await ctx.db.get(request.institutionId);
    const loanDays = institution?.loanDurationDays ?? 14;

    const now = Date.now();
    const dueDate = now + loanDays * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.requestId, { status: "approved" });

    await ctx.db.insert("borrowings", {
      bookId: request.bookId,
      userId: request.userId,
      borrowDate: now,
      dueDate,
      institutionId: request.institutionId,
      libraryId: request.libraryId,
      penalty: 0,
      penaltyPaid: 0,
      status: "active",
      renewCount: 0,
    });

    const borrowerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", request.userId))
      .unique();
    if (borrowerProfile) {
      await ctx.db.patch(borrowerProfile._id, {
        borrowedBooks: borrowerProfile.borrowedBooks + 1,
      });
    }

    const book = await ctx.db.get(request.bookId);
    await ctx.db.insert("notifications", {
      userId: request.userId,
      type: "request_approved",
      title: "Request Approved",
      message: `Your request to borrow "${book?.title ?? "a book"}" has been approved.`,
      isRead: false,
      createdAt: now,
    });

    return { success: true };
  },
});

export const rejectRequest = mutation({
  args: {
    requestId: v.id("requests"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    if (!canManageBorrowings(profile)) throw new Error("Not authorized");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    requireInstitutionAccess(profile, request.institutionId);

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      notes: args.notes,
    });

    const book = await ctx.db.get(request.bookId);
    if (book) {
      await ctx.db.patch(request.bookId, {
        available: book.available + 1,
        status: "Available",
      });
    }

    await ctx.db.insert("notifications", {
      userId: request.userId,
      type: "request_rejected",
      title: "Request Rejected",
      message: `Your request to borrow "${book?.title ?? "a book"}" was rejected.${args.notes ? ` Reason: ${args.notes}` : ""}`,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const renewBook = mutation({
  args: {
    borrowingId: v.id("borrowings"),
  },
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const borrowing = await ctx.db.get(args.borrowingId);
    if (!borrowing) throw new Error("Borrowing not found");

    if (borrowing.userId !== profile.userId && !canManageBorrowings(profile)) {
      throw new Error("Not authorized");
    }
    if (borrowing.status !== "active") throw new Error("Borrowing is not active");

    const maxRenewals = 2;
    if (borrowing.renewCount >= maxRenewals) {
      throw new Error("Maximum renewals reached");
    }

    const holds = await ctx.db
      .query("bookQueue")
      .withIndex("by_bookId_status", (q) =>
        q.eq("bookId", borrowing.bookId).eq("status", "waiting"),
      )
      .first();
    if (holds) throw new Error("Cannot renew: other users are waiting for this book");

    const institution = await ctx.db.get(borrowing.institutionId);
    const loanDays = institution?.loanDurationDays ?? 14;
    const newDueDate =
      Math.max(borrowing.dueDate, Date.now()) + loanDays * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.borrowingId, {
      dueDate: newDueDate,
      renewCount: borrowing.renewCount + 1,
      status: "active",
    });

    return { newDueDate };
  },
});
