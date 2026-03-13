import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Expire pending requests that have passed their expiration date (every hour)
crons.interval("expire requests", { hours: 1 }, internal.cronHandlers.expireRequests);

// Send due date reminders (daily at 8am)
crons.daily("due reminders", { hourUTC: 8, minuteUTC: 0 }, internal.cronHandlers.sendDueReminders);

// Mark overdue borrowings (daily at 1am)
crons.daily("mark overdue", { hourUTC: 1, minuteUTC: 0 }, internal.cronHandlers.markOverdueBorrowings);

// Advance hold queue for expired notifications (every 4 hours)
crons.interval("advance hold queue", { hours: 4 }, internal.cronHandlers.advanceHoldQueue);

export default crons;
