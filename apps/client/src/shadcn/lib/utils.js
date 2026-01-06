// src/shadcn/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Proper Tailwind class merging
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Your existing hasAccess function (NO toast import)
export const hasAccess = (response) => {
  if (response.status === 401) {
    console.warn("Unauthorized access - please check your permissions.");
  }
  return response;
};

// Additional utility functions
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};