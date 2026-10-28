// client/src/components/ui/select.jsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

/**
 * Reusable Select primitive styled consistently with existing inputs.
 * Accepts options as array of strings or { label, value } objects, or standard <option> children.
 */
export function Select({
  className,
  options = [],
  placeholder,
  value,
  onChange,
  disabled = false,
  children,
  size = "default",
  ...props
}) {
  const sizeClasses = {
    sm: "h-7 text-xs px-2 py-0.5",
    default: "h-8 text-xs sm:text-sm px-2.5 py-1",
    lg: "h-9 text-sm px-3 py-1.5",
  }[size] || "h-8 text-xs sm:text-sm px-2.5 py-1";

  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        data-slot="select"
        className={cn(
          "w-full appearance-none rounded-lg border border-input bg-background dark:bg-input/30 text-foreground transition-colors outline-none pr-8 cursor-pointer",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          sizeClasses,
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="text-muted-foreground">
            {placeholder}
          </option>
        )}
        {options.length > 0
          ? options.map((opt) => {
              const val = typeof opt === "object" ? opt.value : opt;
              const lbl = typeof opt === "object" ? opt.label : opt;
              return (
                <option key={String(val)} value={val} className="bg-popover text-popover-foreground">
                  {lbl}
                </option>
              );
            })
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground opacity-70" />
    </div>
  );
}

export default Select;
