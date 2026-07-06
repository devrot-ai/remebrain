import { useEffect, useState } from "react";
import { pipelineSteps } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export function PipelineFlow({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = setInterval(
      () => setStep((s) => (s + 1) % pipelineSteps.length),
      compact ? 700 : 1000,
    );
    return () => clearInterval(i);
  }, [compact]);

  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-6")}>
      {pipelineSteps.map((s, i) => {
        const active = i === step;
        const passed = i < step;
        return (
          <div
            key={s.key}
            className={cn(
              "rounded-[20px] p-3 flex flex-col items-center gap-1 text-center transition-all duration-300",
              active
                ? "soft-pressed text-brand-blue scale-[1.03]"
                : passed
                  ? "soft-raised-sm text-brand-green"
                  : "soft-raised-sm text-muted-foreground opacity-70",
            )}
          >
            <div className="text-lg">{s.icon}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide leading-tight">
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
