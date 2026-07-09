import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera as CameraIcon,
  ShieldAlert,
  UserCheck,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { CountUp } from "@/components/soft/CountUp";
import { PipelineFlow } from "@/components/PipelineFlow";
import { dashboardStats } from "@/lib/violations.functions";
import { listDetections } from "@/lib/detections.functions";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "LitterCam AI — Command Center" },
      {
        name: "description",
        content: "AI-assisted traffic litter enforcement dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const toneClass = {
  blue: "text-brand-blue",
  green: "text-brand-green",
  red: "text-brand-red",
  gold: "text-brand-gold",
} as const;

function Dashboard() {
  const statsFn = useServerFn(dashboardStats);
  const listDet = useServerFn(listDetections);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => statsFn(),
    refetchInterval: 15000,
  });
  const { data: recent = [] } = useQuery({
    queryKey: ["detections", "recent"],
    queryFn: () => listDet({ data: { limit: 6 } }),
    refetchInterval: 10000,
  });

  const kpis = [
    {
      icon: CameraIcon,
      label: "Cameras online",
      value: stats?.camerasOnline ?? 0,
      suffix: stats ? ` / ${stats.cameras}` : "",
      tone: "blue" as const,
    },
    {
      icon: ShieldAlert,
      label: "Today's violations",
      value: stats?.todayViolations ?? 0,
      tone: "red" as const,
      suffix: "",
    },
    {
      icon: UserCheck,
      label: "Pending review",
      value: stats?.pending ?? 0,
      tone: "gold" as const,
      suffix: "",
    },
    {
      icon: Gauge,
      label: "Total detections",
      value: stats?.totalDetections ?? 0,
      tone: "green" as const,
      suffix: "",
    },
  ];

  return (
    <>
      <TopBar
        title="Command center"
        subtitle={
          stats ? `${stats.camerasOnline} of ${stats.cameras} cameras active` : "Loading…"
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <SoftCard hover className="!p-5">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`soft-pressed-sm h-9 w-9 rounded-xl grid place-items-center ${toneClass[s.tone]}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  {s.label}
                </div>
                <div className="text-[28px] leading-none font-black tracking-tight mt-2 tabular-nums">
                  <CountUp value={s.value} />
                  {s.suffix && (
                    <span className="text-base text-muted-foreground">{s.suffix}</span>
                  )}
                </div>
              </SoftCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <SoftCard className="xl:col-span-2">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                AI detection pipeline
              </div>
              <h2 className="text-lg font-bold">Live inference flow</h2>
            </div>
            <SoftBadge tone="green">Ready</SoftBadge>
          </div>
          <PipelineFlow />
        </SoftCard>

        <SoftCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Get started
              </div>
              <h2 className="text-lg font-bold">Next step</h2>
            </div>
          </div>
          <div className="soft-pressed rounded-[24px] p-6 text-sm text-muted-foreground leading-relaxed">
            {stats?.cameras === 0 ? (
              <>
                Add your first camera on the <b>Cameras</b> page and open its live view to
                start capturing frames from your webcam.
              </>
            ) : (
              <>
                Open the <b>Cameras</b> page, pick a camera, and hit <b>Start analyzing</b>{" "}
                to begin real-time detection.
              </>
            )}
            <Link
              to="/cameras"
              className="soft-raised-sm soft-press rounded-2xl px-4 py-2 text-xs font-bold text-brand-blue inline-flex items-center gap-1 mt-4"
            >
              Go to cameras <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </SoftCard>
      </div>

      <SoftCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Latest detections
            </div>
            <h2 className="text-lg font-bold">Freshly captured events</h2>
          </div>
          <Link
            to="/detections"
            className="soft-raised-sm soft-press rounded-2xl px-3 py-2 text-xs font-bold text-brand-blue inline-flex items-center gap-1"
          >
            View feed <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No detections yet — start a camera to see events here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recent.map((d) => (
              <div
                key={d.id}
                className="soft-raised-sm rounded-[24px] p-4 flex gap-4"
              >
                <div className="soft-pressed rounded-2xl h-16 w-24 shrink-0 grid place-items-center text-xs font-black text-brand-blue">
                  {d.plate_guess || "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm truncate">
                    {d.litter_type || (d.litter_detected ? "Litter" : "No litter")}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {d.vehicle_color} {d.vehicle}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <SoftBadge tone={d.litter_detected ? "red" : "green"}>
                      {d.litter_detected ? "violation" : "clean"}
                    </SoftBadge>
                    <SoftBadge tone="blue">{(d.confidence * 100).toFixed(0)}%</SoftBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SoftCard>
    </>
  );
}
