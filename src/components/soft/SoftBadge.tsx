import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "red" | "gold" | "muted";

const toneClass: Record<Tone, string> = {
  blue: "text-brand-blue",
  green: "text-brand-green",
  red: "text-brand-red",
  gold: "text-brand-gold",
  muted: "text-muted-foreground",
};

export function SoftBadge({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "soft-pressed-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
