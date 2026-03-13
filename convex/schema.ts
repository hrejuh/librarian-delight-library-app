import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// --- Validators ---

const roleValidator = v.union(
  v.literal("student"),
  v.literal("librarian"),
  v.literal("admin"),
  v.literal("super_admin"),
);

const bookStatusValidator = v.union(
  v.literal("Available"),
  v.literal("Borrowed"),
  v.literal("Reserved"),
  v.literal("Maintenance"),
  v.literal("Lost"),
);

const bookConditionValidator = v.union(
  v.literal("New"),
  v.literal("Good"),
  v.literal("Fair"),
  v.literal("Poor"),
);

const requestStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("expired"),
);

const borrowingStatusValidator = v.union(
  v.literal("active"),
  v.literal("returned"),
  v.literal("overdue"),
);

const fineReasonValidator = v.union(
  v.literal("overdue"),
  v.literal("damage"),
  v.literal("lost"),
);

const fineStatusValidator = v.union(
  v.literal("unpaid"),
  v.literal("partial"),
  v.literal("paid"),
  v.literal("waived"),
);

const queueStatusValidator = v.union(
  v.literal("waiting"),
  v.literal("notified"),
  v.literal("fulfilled"),
  v.literal("cancelled"),
);

const notificationTypeValidator = v.union(
  v.literal("due_reminder"),
  v.literal("overdue"),
  v.literal("hold_ready"),
  v.literal("request_approved"),
  v.literal("request_rejected"),
  v.literal("fine_added"),
  v.literal("queue_position"),
  v.literal("system"),
);

// --- Schema ---

export default defineSchema({
  ...authTables,

  // User profiles with role-based access
  profiles: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    role: roleValidator,
    institutionId: v.optional(v.id("institutions")),
    libraryId: v.optional(v.id("libraries")),
    userType: v.optional(v.string()),
    borrowedBooks: v.number(),
    finesOwed: v.optional(v.number()),
    isWalkIn: v.optional(v.boolean()),
    maxBooks: v.optional(v.number()),
    loanDurationDays: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_institutionId", ["institutionId"])
    .index("by_institutionId_role", ["institutionId", "role"]),

  // Tenant organizations
  institutions: defineTable({
    name: v.string(),
    address: v.string(),
    adminName: v.string(),
    adminEmail: v.string(),
    organizationStructure: v.optional(v.any()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    offDays: v.optional(v.array(v.string())),
    reserveDurationDays: v.optional(v.number()),
    loanDurationDays: v.optional(v.number()),
    lateFinPerDay: v.optional(v.number()),
    rules: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  }).index("by_adminEmail", ["adminEmail"]),

  // Physical library locations within an institution
  libraries: defineTable({
    name: v.string(),
    address: v.string(),
    institutionId: v.id("institutions"),
    contactInfo: v.optional(v.any()),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    daysClosed: v.optional(v.array(v.string())),
    resources: v.optional(v.array(v.string())),
    shelves: v.optional(v.any()),
    managedBy: v.optional(v.array(v.string())),
    userTypes: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
  }).index("by_institutionId", ["institutionId"]),

  // User ↔ library access mapping
  libraryAccess: defineTable({
    libraryId: v.id("libraries"),
    profileId: v.id("profiles"),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_libraryId", ["libraryId"])
    .index("by_profileId", ["profileId"]),

  // Book catalog
  books: defineTable({
    title: v.string(),
    authors: v.array(v.string()),
    genres: v.array(v.string()),
    summary: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    status: bookStatusValidator,
    available: v.number(),
    total: v.number(),
    publisher: v.optional(v.string()),
    publishDate: v.optional(v.string()),
    language: v.optional(v.string()),
    isbn13: v.optional(v.string()),
    isbn10: v.optional(v.string()),
    coverType: v.optional(
      v.union(v.literal("Hardcover"), v.literal("Paperback")),
    ),
    institutionId: v.id("institutions"),
    libraryId: v.optional(v.id("libraries")),
    pageCount: v.optional(v.number()),
    edition: v.optional(v.string()),
    shelfLocation: v.optional(v.string()),
    condition: v.optional(bookConditionValidator),
  })
    .index("by_institutionId", ["institutionId"])
    .index("by_libraryId", ["libraryId"])
    .index("by_isbn13", ["isbn13"])
    .index("by_institutionId_status", ["institutionId", "status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["institutionId"],
    }),

  // Global author catalog
  authors: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  // Global genre catalog
  genres: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  // Active borrowing records
  borrowings: defineTable({
    bookId: v.id("books"),
    userId: v.id("users"),
    institutionId: v.id("institutions"),
    libraryId: v.optional(v.id("libraries")),
    borrowDate: v.number(),
    dueDate: v.number(),
    returnDate: v.optional(v.number()),
    penalty: v.number(),
    penaltyPaid: v.number(),
    status: borrowingStatusValidator,
    renewCount: v.number(),
    checkoutCondition: v.optional(v.string()),
    returnCondition: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_bookId", ["bookId"])
    .index("by_institutionId", ["institutionId"])
    .index("by_institutionId_status", ["institutionId", "status"])
    .index("by_userId_status", ["userId", "status"]),

  // Borrow requests awaiting approval
  requests: defineTable({
    bookId: v.id("books"),
    userId: v.id("users"),
    requestDate: v.number(),
    expirationDate: v.number(),
    status: requestStatusValidator,
    notes: v.optional(v.string()),
    institutionId: v.id("institutions"),
    libraryId: v.optional(v.id("libraries")),
  })
    .index("by_userId", ["userId"])
    .index("by_institutionId", ["institutionId"])
    .index("by_institutionId_status", ["institutionId", "status"])
    .index("by_bookId", ["bookId"])
    .index("by_status", ["status"]),

  // Hold/waitlist queue for unavailable books
  bookQueue: defineTable({
    bookId: v.id("books"),
    userId: v.id("users"),
    institutionId: v.id("institutions"),
    position: v.number(),
    status: queueStatusValidator,
    notifiedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_bookId", ["bookId"])
    .index("by_userId", ["userId"])
    .index("by_bookId_status", ["bookId", "status"]),

  // Fine tracking
  fines: defineTable({
    userId: v.id("users"),
    borrowingId: v.id("borrowings"),
    amount: v.number(),
    paidAmount: v.number(),
    reason: fineReasonValidator,
    status: fineStatusValidator,
    institutionId: v.id("institutions"),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    waivedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_institutionId", ["institutionId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_borrowingId", ["borrowingId"]),

  // Configurable circulation rules per patron type
  circulationRules: defineTable({
    institutionId: v.id("institutions"),
    patronType: v.string(),
    maxBooks: v.number(),
    loanDurationDays: v.number(),
    reserveDurationDays: v.number(),
    maxRenewals: v.number(),
    finePerDay: v.number(),
    maxConcurrentHolds: v.number(),
  })
    .index("by_institutionId", ["institutionId"])
    .index("by_institutionId_patronType", ["institutionId", "patronType"]),

  // User notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
