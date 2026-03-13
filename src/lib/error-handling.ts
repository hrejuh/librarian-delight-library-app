import { toast } from "sonner";

export type ErrorType = 
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "AUTH_ERROR"
  | "DATABASE_ERROR"
  | "PERMISSION_ERROR"
  | "NOT_FOUND_ERROR"
  | "RATE_LIMIT_ERROR"
  | "UNKNOWN_ERROR";

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  code?: string;
  timestamp: number;
  stack?: string;
}

// Error codes for better error tracking
const ERROR_CODES = {
  VALIDATION: {
    INVALID_INPUT: "VAL001",
    MISSING_REQUIRED: "VAL002",
    INVALID_FORMAT: "VAL003",
  },
  AUTH: {
    UNAUTHORIZED: "AUTH001",
    INVALID_CREDENTIALS: "AUTH002",
    SESSION_EXPIRED: "AUTH003",
  },
  DATABASE: {
    QUERY_FAILED: "DB001",
    CONNECTION_FAILED: "DB002",
    TRANSACTION_FAILED: "DB003",
  },
  NETWORK: {
    TIMEOUT: "NET001",
    CONNECTION_LOST: "NET002",
    SERVER_ERROR: "NET003",
  },
  PERMISSION: {
    INSUFFICIENT_PERMISSIONS: "PERM001",
    ROLE_REQUIRED: "PERM002",
    INSTITUTION_REQUIRED: "PERM003",
  },
} as const;

// User-friendly error messages
const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION.INVALID_INPUT]: "Invalid input provided",
  [ERROR_CODES.VALIDATION.MISSING_REQUIRED]: "Required field is missing",
  [ERROR_CODES.VALIDATION.INVALID_FORMAT]: "Invalid format provided",
  [ERROR_CODES.AUTH.UNAUTHORIZED]: "You are not authorized to perform this action",
  [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: "Invalid credentials provided",
  [ERROR_CODES.AUTH.SESSION_EXPIRED]: "Your session has expired. Please log in again",
  [ERROR_CODES.DATABASE.QUERY_FAILED]: "Failed to execute database query",
  [ERROR_CODES.DATABASE.CONNECTION_FAILED]: "Failed to connect to database",
  [ERROR_CODES.DATABASE.TRANSACTION_FAILED]: "Database transaction failed",
  [ERROR_CODES.NETWORK.TIMEOUT]: "Request timed out",
  [ERROR_CODES.NETWORK.CONNECTION_LOST]: "Connection lost",
  [ERROR_CODES.NETWORK.SERVER_ERROR]: "Server error occurred",
  [ERROR_CODES.PERMISSION.INSUFFICIENT_PERMISSIONS]: "You don't have sufficient permissions",
  [ERROR_CODES.PERMISSION.ROLE_REQUIRED]: "Required role is missing",
  [ERROR_CODES.PERMISSION.INSTITUTION_REQUIRED]: "Institution association required",
} as const;

export const handleError = (error: unknown): AppError => {
  const timestamp = Date.now();
  const stack = error instanceof Error ? error.stack : undefined;

  // Handle Convex errors
  if (error && typeof error === 'object' && 'data' in error) {
    const convexError = error as { data: unknown; message: string };
    return {
      type: "DATABASE_ERROR",
      message: convexError.message || "A database error occurred",
      details: typeof convexError.data === 'string' ? convexError.data : JSON.stringify(convexError.data),
      code: ERROR_CODES.DATABASE.QUERY_FAILED,
      timestamp,
      stack,
    };
  }

  // Handle known error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes("validation") || message.includes("invalid")) {
      return {
        type: "VALIDATION_ERROR",
        message: ERROR_MESSAGES[ERROR_CODES.VALIDATION.INVALID_INPUT],
        details: error.message,
        code: ERROR_CODES.VALIDATION.INVALID_INPUT,
        timestamp,
        stack
      };
    }
    if (message.includes("network") || message.includes("timeout")) {
      return {
        type: "NETWORK_ERROR",
        message: ERROR_MESSAGES[ERROR_CODES.NETWORK.CONNECTION_LOST],
        details: error.message,
        code: ERROR_CODES.NETWORK.CONNECTION_LOST,
        timestamp,
        stack
      };
    }
    if (message.includes("auth") || message.includes("unauthorized")) {
      return {
        type: "AUTH_ERROR",
        message: ERROR_MESSAGES[ERROR_CODES.AUTH.UNAUTHORIZED],
        details: error.message,
        code: ERROR_CODES.AUTH.UNAUTHORIZED,
        timestamp,
        stack
      };
    }
    if (message.includes("database") || message.includes("query")) {
      return {
        type: "DATABASE_ERROR",
        message: ERROR_MESSAGES[ERROR_CODES.DATABASE.QUERY_FAILED],
        details: error.message,
        code: ERROR_CODES.DATABASE.QUERY_FAILED,
        timestamp,
        stack
      };
    }
    if (message.includes("permission") || message.includes("access denied")) {
      return {
        type: "PERMISSION_ERROR",
        message: ERROR_MESSAGES[ERROR_CODES.PERMISSION.INSUFFICIENT_PERMISSIONS],
        details: error.message,
        code: ERROR_CODES.PERMISSION.INSUFFICIENT_PERMISSIONS,
        timestamp,
        stack
      };
    }
  }
  
  // Handle unknown errors
  return {
    type: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
    details: error instanceof Error ? error.message : String(error),
    code: "UNKNOWN",
    timestamp,
    stack
  };
};

export const showErrorToast = (error: AppError) => {
  // Log error for tracking
  console.error(`[${error.code}] ${error.message}`, {
    details: error.details,
    timestamp: new Date(error.timestamp).toISOString(),
    stack: error.stack
  });

  // Show user-friendly toast
  toast.error(error.message, {
    description: error.details
  });
};

export const handleAndShowError = (error: unknown) => {
  const appError = handleError(error);
  showErrorToast(appError);
  return appError;
}; 