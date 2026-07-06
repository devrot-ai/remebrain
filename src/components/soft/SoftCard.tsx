import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "raised" | "pressed" | "flat";

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  hover?: boolean;
  padded?: boolean;
}

export const SoftCard = forwardRef<HTMLDivElement, Props>(function SoftCard(
  { variant = "raised", hover, padded = true, className, ...rest },
  ref,
) {
  const variantClass =
    variant === "pressed" ? "soft-pressed" : variant === "flat" ? "soft-flat" : "soft-raised";
  return (
    <div
      ref={ref}
      className={cn(
        variantClass,
        hover && "soft-hover",
        padded && "p-6",
        "rounded-[30px]",
        className,
      )}
      {...rest}
    />
  );
});
