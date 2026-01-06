// src/shadcn/ui/scroll-area.jsx
import * as React from "react";

const ScrollArea = React.forwardRef(({ 
  className = "", 
  children, 
  style,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={`overflow-auto ${className}`}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        ...style
      }}
      {...props}
    >
      <style>{`
        .overflow-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  );
});

export { ScrollArea };