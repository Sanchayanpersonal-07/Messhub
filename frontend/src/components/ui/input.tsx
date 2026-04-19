import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base md:text-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none input-placeholder input-file input-focus",
          className
        )}
        style={{
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          borderColor: "hsl(var(--input))",
          ...style,
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
