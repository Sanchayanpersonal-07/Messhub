import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentPropsWithoutRef<"textarea">;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onFocus, onBlur, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
        className={cn(
          "w-full min-h-20 resize-none rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          borderColor: "hsl(var(--input))",
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow =
            "0 0 0 2px hsl(var(--ring))";
          onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          onBlur?.(e);
        }}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };