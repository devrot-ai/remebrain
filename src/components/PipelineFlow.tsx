import { useEffect, useState } from "react";
import {
  Film,
  Car,
  Crosshair,
  User,
  Hand,
  Trash2,
  TrendingUp,
  Link2,
  ScanLine,
  Camera,
  UserCheck,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { pipelineSteps } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const stepIcons: Record<string, LucideIcon> = {
  frame: Film,
  vehicle: Car,
  track: Crosshair,
  pose: User,
  hand: Hand,
  trash: Trash2,
  traj: TrendingUp,
  assoc: Link2,
  plate: ScanLine,
  evidence: Camera,
  review: UserCheck,
  approved: CheckCircle2,
};

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
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
      )}
    >
      {pipelineSteps.map((s, i) => {
        const active = i === step;
        const passed = i < step;
        const Icon = stepIcons[s.key];
        return (
          <div
            key={s.key}
            className={cn(
              "rounded-[20px] p-3 flex flex-col items-center gap-2 text-center transition-all duration-300",
              active
                ? "soft-pressed scale-[1.03]"
                : "soft-raised-sm",
            )}
          >
            <div
              className={cn(
                "h-9 w-9 rounded-xl grid place-items-center transition-colors",
                active
                  ? "soft-pressed-sm text-brand-blue"
                  : passed
                    ? "soft-pressed-sm text-brand-green"
                    : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide leading-tight",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
