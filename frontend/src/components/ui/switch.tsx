import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, defaultChecked, ...props }, ref) => {
  // ✅ FIX: derive isChecked safely — handles both controlled and uncontrolled usage
  // props.checked could be undefined in uncontrolled mode → fallback to false
  const isChecked = checked ?? false;

  return (
    <SwitchPrimitives.Root
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      {...props}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        backgroundColor: isChecked
          ? "hsl(var(--primary))"
          : "hsl(var(--input))",
      }}
      data-state={isChecked ? "checked" : "unchecked"}
    >
      <SwitchPrimitives.Thumb
        className="pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-transform"
        style={{
          backgroundColor: "hsl(var(--background))",
          transform: isChecked ? "translateX(20px)" : "translateX(0px)",
        }}
      />
    </SwitchPrimitives.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
