// src/shadcn/ui/alert.jsx
import * as React from "react";

const Alert = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`
        flex items-start gap-3
        p-4 rounded-lg border
        border-blue-200 bg-blue-50 text-blue-800
        ${className || ""}
      `}
      {...props}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
});
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm ${className || ""}`}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Simple AlertCircle icon component (since you might not have lucide-react)
const AlertCircle = ({ className, ...props }) => (
  <svg
    className={`h-5 w-5 ${className || ""}`}
    fill="currentColor"
    viewBox="0 0 20 20"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

export { Alert, AlertDescription };