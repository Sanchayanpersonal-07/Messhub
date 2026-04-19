import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  const variantStyles: Record<
    "default" | "secondary" | "destructive" | "outline",
    React.CSSProperties
  > = {
    default: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      borderColor: "transparent",
    },
    secondary: {
      backgroundColor: "hsl(var(--secondary))",
      color: "hsl(var(--secondary-foreground))",
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: "hsl(var(--destructive))",
      color: "hsl(var(--destructive-foreground))",
      borderColor: "transparent",
    },
    outline: {
      backgroundColor: "transparent",
      color: "hsl(var(--foreground))",
      borderColor: "hsl(var(--border))",
    },
  };

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={variantStyles[variant ?? "default"]}
      {...props}
    />
  );
}

export { Badge };