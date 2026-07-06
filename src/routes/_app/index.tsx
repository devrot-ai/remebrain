import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Camera as CameraIcon,
  Gauge,
  ShieldAlert,
  UserCheck,
  Percent,
  Heart,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { CountUp } from "@/components/soft/CountUp";
import { PipelineFlow } from "@/components/PipelineFlow";
import { cameras, detections } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "LitterCam AI — Smart City Command Center" },
      {
        name: "description",
        content:
          "AI-assisted traffic litter enforcement dashboard. All violations reviewed by authorized officers.",
      },
      { property: "og:title", content: "LitterCam AI — Smart City Command Center" },
      {
        property: "og:description",
        content: "Human-in-the-loop AI enforcement for cleaner streets.",
      },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { icon: CameraIcon, label: "Active Cameras", value: 128, tone: "blue" as const, suffix: "" },
  { icon: Gauge, label: "AI Accuracy", value: 96.4, decimals: 1, tone: "green" as const, suffix: "%" },
  { icon: ShieldAlert, label: "Today's Violations", value: 214, tone: "red" as const, suffix: "" },
  { icon: UserCheck, label: "Pending Reviews", value: 37, tone: "gold" as const, suffix: "" },
  { icon: Percent, label: "False Positive Rate", value: 2.1, decimals: 1, tone: "gold" as const, suffix: "%" },
  { icon: Heart, label: "System Health", value: 99.9, decimals: 1, tone: "green" as const, suffix: "%" },
];

const toneClass = {
  blue: "text-brand-blue",
  green: "text-brand-green",
  red: "text-brand-red",
  gold: "text-brand-gold",
};

function Dashboard() {
  const recent = detections.slice(0, 5);
  return (
    <>
      <TopBar
        title="City surveillance overview"
        subtitle={`${cameras.filter((c) => c.status === "online").length} of ${cameras.length} camera zones online`}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <SoftCard hover className="!p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`soft-pressed-sm h-10 w-10 rounded-2xl grid place-items-center ${toneClass[s.tone]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className={`text-2xl font-black mt-1 ${toneClass[s.tone]}`}>
                  <CountUp value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
                </div>
              </SoftCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <SoftCard className="xl:col-span-2">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                AI Detection Pipeline
              </div>
              <h2 className="text-lg font-bold">Live 12-stage inference flow</h2>
            </div>
            <SoftBadge tone="green">Processing</SoftBadge>
          </div>
          <PipelineFlow />
        </SoftCard>

        <SoftCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Review Queue
              </div>
              <h2 className="text-lg font-bold">Awaiting officer decision</h2>
            </div>
            <Link
              to="/review"
              className="soft-raised-sm soft-press rounded-2xl px-3 py-2 text-xs font-bold text-brand-blue inline-flex items-center gap-1"
            >
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="soft-pressed rounded-[24px] p-5 flex items-center justify-center flex-col">
            <div className="text-6xl font-black text-brand-gold">
              <CountUp value={37} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">Pending violations</div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center w-full">
              <div>
                <div className="text-lg font-bold text-brand-green">
                  <CountUp value={182} />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">Approved</div>
              </div>
              <div>
                <div className="text-lg font-bold text-brand-red">
                  <CountUp value={9} />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">Rejected</div>
              </div>
              <div>
                <div className="text-lg font-bold text-brand-blue">
                  <CountUp value={4} />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">False+</div>
              </div>
            </div>
          </div>
        </SoftCard>
      </div>

      <SoftCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Latest Detections
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recent.map((d) => (
            <Link
              key={d.id}
              to="/violations/$id"
              params={{ id: d.id }}
              className="soft-raised-sm soft-hover rounded-[24px] p-4 flex gap-4"
            >
              <div className="soft-pressed rounded-2xl h-16 w-24 shrink-0 grid place-items-center text-xs font-black text-brand-blue">
                {d.plate}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{d.litter}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {d.color} {d.vehicle} · {d.cameraName}
                </div>
                <div className="flex gap-1.5 mt-2">
                  <SoftBadge tone={d.status === "pending" ? "gold" : d.status === "approved" ? "green" : "red"}>
                    {d.status}
                  </SoftBadge>
                  <SoftBadge tone="blue">{(d.confidence * 100).toFixed(0)}%</SoftBadge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SoftCard>
    </>
  );
}
