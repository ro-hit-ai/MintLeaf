// src/shadcn/ui/badge.jsx
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 capitalize",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-800",
        secondary: "bg-gray-100 text-gray-800",
        destructive: "bg-red-100 text-red-800",
        outline: "border border-gray-300 text-gray-700",
        success: "bg-green-100 text-green-800",
        warning: "bg-amber-100 text-amber-800",
        info: "bg-blue-100 text-blue-800",
        // Ticket-specific variants
        open: "bg-amber-50 text-amber-700 border border-amber-100",
        closed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        high: "bg-red-100 text-red-800",
        medium: "bg-blue-100 text-blue-800", 
        low: "bg-green-100 text-green-800",
        normal: "bg-green-100 text-green-800",
        type: "bg-orange-400 text-white", // For ticket type
      },
      size: {
        default: "px-2.5 py-0.5 text-[11px]",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({ className, variant, size, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };