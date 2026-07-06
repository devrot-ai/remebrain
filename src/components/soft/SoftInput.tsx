import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const SoftInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function SoftInput({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "soft-pressed-sm rounded-[18px] px-5 py-3 text-sm w-full outline-none",
          "text-foreground placeholder:text-muted-foreground",
          "focus:soft-pressed transition-shadow duration-200",
          className,
        )}
        {...rest}
      />
    );
  },
);
