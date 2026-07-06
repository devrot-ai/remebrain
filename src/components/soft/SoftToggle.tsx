import { cn } from "@/lib/utils";

export function SoftToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 select-none"
      type="button"
    >
      <span className="soft-pressed-sm relative h-7 w-12 rounded-full transition-all">
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full soft-raised-sm transition-all duration-300",
            checked ? "left-6 bg-brand-blue/20" : "left-1",
          )}
        />
      </span>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </button>
  );
}
