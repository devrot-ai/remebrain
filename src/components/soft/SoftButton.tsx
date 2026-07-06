import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "success" | "danger" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const accentClass: Record<Variant, string> = {
  default: "text-foreground",
  primary: "text-brand-blue",
  success: "text-brand-green",
  danger: "text-brand-red",
  ghost: "text-muted-foreground",
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
  icon: "h-11 w-11 grid place-items-center",
};

export const SoftButton = forwardRef<HTMLButtonElement, Props>(function SoftButton(
  { variant = "default", size = "md", icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "soft-raised-sm soft-press rounded-[20px] font-semibold tracking-tight",
        "inline-flex items-center justify-center gap-2 select-none",
        "hover:-translate-y-0.5 transition-transform duration-200",
        "disabled:opacity-50 disabled:pointer-events-none",
        accentClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
