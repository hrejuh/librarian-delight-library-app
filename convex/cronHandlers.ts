import { internalMutation } from "./_generated/server";

export const expireRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pendingRequests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    for (const request of pendingRequests) {
      if (request.expirationDate < now) {
        await ctx.db.patch(request._id, { status: "expired" });
        // Restore book availability
        const book = await ctx.db.get(request.bookId);
        if (book) {
          await ctx.db.patch(request.bookId, {
            available: book.available + 1,
            status: "Available",
          });
        }
      }
    }
  },
});

export const sendDueReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    // Get all active borrowings due within 3 days
    const borrowings = await ctx.db.query("borrowings").collect();
    const dueSoon = borrowings.filter(
      (b) =>
        b.status === "active" &&
        b.dueDate > now &&
        b.dueDate <= now + threeDaysMs,
    );

    for (const borrowing of dueSoon) {
      const book = await ctx.db.get(borrowing.bookId);
      const daysLeft = Math.ceil((borrowing.dueDate - now) / (24 * 60 * 60 * 1000));
      await ctx.db.insert("notifications", {
        userId: borrowing.userId,
        type: "due_reminder",
        title: "Book Due Soon",
        message: `"${book?.title ?? "A book"}" is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        isRead: false,
        createdAt: now,
      });
    }
  },
});

export const markOverdueBorrowings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const borrowings = await ctx.db.query("borrowings").collect();
    const overdue = borrowings.filter(
      (b) => b.status === "active" && b.dueDate < now,
    );

    for (const borrowing of overdue) {
      await ctx.db.patch(borrowing._id, { status: "overdue" });
      const book = await ctx.db.get(borrowing.bookId);
      await ctx.db.insert("notifications", {
        userId: borrowing.userId,
        type: "overdue",
        title: "Book Overdue",
        message: `"${book?.title ?? "A book"}" is now overdue. Please return it as soon as possible.`,
        isRead: false,
        createdAt: now,
      });
    }
  },
});

export const advanceHoldQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const holdExpireMs = 3 * 24 * 60 * 60 * 1000; // 3 days to pick up

    // Find notified holds that have expired
    const allQueue = await ctx.db.query("bookQueue").collect();
    const expiredNotified = allQueue.filter(
      (entry) =>
        entry.status === "notified" &&
        entry.notifiedAt &&
        entry.notifiedAt + holdExpireMs < now,
    );

    for (const entry of expiredNotified) {
      await ctx.db.patch(entry._id, { status: "cancelled" });

      // Notify next in queue
      const nextInQueue = allQueue.find(
        (item) =>
          item.bookId === entry.bookId &&
          item.status === "waiting" &&
          item._id !== entry._id,
      );
      if (nextInQueue) {
        await ctx.db.patch(nextInQueue._id, {
          status: "notified",
          notifiedAt: now,
        });
        const book = await ctx.db.get(nextInQueue.bookId);
        await ctx.db.insert("notifications", {
          userId: nextInQueue.userId,
          type: "hold_ready",
          title: "Book Available",
          message: `The book "${book?.title ?? "a book"}" you were waiting for is now available.`,
          isRead: false,
          createdAt: now,
        });
      }
    }
  },
});
