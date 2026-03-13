import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string to prevent XSS attacks
 * @param str The string to sanitize
 * @returns The sanitized string
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';
  
  // Convert to string if not already
  const stringValue = String(str);
  
  // Replace potentially dangerous characters
  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Formats a number as currency
 * @param amount The amount to format
 * @returns The formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

/**
 * Formats a date string or Date object to DD/MM/YY format
 * @param date - Date string or Date object to format
 * @returns Formatted date string in DD/MM/YY format
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};
