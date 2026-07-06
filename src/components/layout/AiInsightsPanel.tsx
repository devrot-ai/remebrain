import { Activity, Cpu, Cloud, Sun, Server, Eye, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { SoftCard } from "@/components/soft/SoftCard";

interface Stat {
  icon: typeof Activity;
  label: string;
  value: string;
  bar: number;
  tone: string;
}

function useTick() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((v) => v + 1), 1800);
    return () => clearInterval(i);
  }, []);
  return t;
}

export function AiInsightsPanel() {
  const t = useTick();
  const stats: Stat[] = [
    { icon: ShieldCheck, label: "Detection confidence", value: `${(92 + (t % 6)).toFixed(0)}%`, bar: 92 + (t % 6), tone: "text-brand-green" },
    { icon: Cpu, label: "Inference speed", value: `${(28 + (t % 4))} FPS`, bar: 80, tone: "text-brand-blue" },
    { icon: Eye, label: "Objects detected", value: `${142 + t * 3}`, bar: 70, tone: "text-brand-blue" },
    { icon: Cloud, label: "Weather", value: "Clear", bar: 90, tone: "text-brand-gold" },
    { icon: Sun, label: "Lighting quality", value: "Optimal", bar: 88, tone: "text-brand-gold" },
    { icon: Activity, label: "GPU usage", value: `${58 + (t % 10)}%`, bar: 58 + (t % 10), tone: "text-brand-blue" },
    { icon: Server, label: "Server health", value: "Nominal", bar: 96, tone: "text-brand-green" },
    { icon: ShieldCheck, label: "False positive prob.", value: `${(2 + (t % 3))}%`, bar: 2 + (t % 3), tone: "text-brand-red" },
  ];

  return (
    <aside className="hidden xl:flex flex-col gap-4 w-[320px] shrink-0 p-6 pl-0">
      <SoftCard className="!p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              AI Insights
            </div>
            <div className="font-bold text-foreground">Live pipeline health</div>
          </div>
          <div className="soft-pressed-sm rounded-full h-9 w-9 grid place-items-center text-brand-green">
            <span className="h-2 w-2 rounded-full bg-current animate-[soft-pulse_1.6s_ease-in-out_infinite]" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </span>
                  <span className={`font-bold ${s.tone}`}>{s.value}</span>
                </div>
                <div className="soft-pressed-sm h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-blue/60 transition-all duration-500"
                    style={{ width: `${Math.min(100, s.bar)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SoftCard>

      <SoftCard className="!p-5">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
          System note
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          Every detection requires human review. AI decisions are advisory. No
          automated penalties are issued.
        </p>
      </SoftCard>
    </aside>
  );
}
