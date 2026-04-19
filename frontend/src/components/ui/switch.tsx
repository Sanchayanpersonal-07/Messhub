import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    {...props}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    style={{
      backgroundColor: props.checked
        ? "hsl(var(--primary))"
        : "hsl(var(--input))",
    }}
    data-state={props.checked ? "checked" : "unchecked"}
  >
    <SwitchPrimitives.Thumb
      className="pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-transform"
      style={{
        backgroundColor: "hsl(var(--background))",
        transform: props.checked ? "translateX(20px)" : "translateX(0px)",
      }}
    />
  </SwitchPrimitives.Root>
));

Switch.displayName = "Switch";

export { Switch };
