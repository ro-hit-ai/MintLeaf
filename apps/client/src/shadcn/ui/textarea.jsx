// src/shadcn/ui/textarea.jsx
import * as React from "react";
import { cn } from "../lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // From new.jsx ticket creation form
        "w-full p-2 border border-gray-300 rounded-md",
        
        // From detail.jsx comment textarea
        "focus:outline-none focus:ring-2 focus:ring-indigo-500",
        
        // From search.jsx search input
        "placeholder:text-gray-400",
        
        // From all ticket forms
        "disabled:opacity-50 disabled:cursor-not-allowed",
        
        // Consistent styling
        "text-sm",
        "resize-y", // Allow vertical resize
        "min-h-[80px]", // Minimum height
        
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };