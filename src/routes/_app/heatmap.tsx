import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { heatmapHotspots, cameras } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/heatmap")({
  head: () => ({
    meta: [
      { title: "City Heatmap — LitterCam AI" },
      { name: "description", content: "Stylized city map of littering density and camera coverage." },
    ],
  }),
  component: HeatmapPage,
});

function HeatmapPage() {
  return (
    <>
      <TopBar title="City heatmap" subtitle="Violation density and camera coverage" />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <SoftCard>
          <div className="soft-pressed rounded-[24px] overflow-hidden relative aspect-[16/10]" style={{ background: "linear-gradient(140deg,#dfe3e9,#c9cfd8)" }}>
            {/* streets */}
            <svg className="absolute inset-0 h-full w-full">
              <defs>
                {heatmapHotspots.map((h, i) => (
                  <radialGradient key={i} id={`hot-${i}`}>
                    <stop offset="0%" stopColor="#e15a5a" stopOpacity={0.6 * h.intensity} />
                    <stop offset="100%" stopColor="#e15a5a" stopOpacity={0} />
                  </radialGradient>
                ))}
              </defs>
              {/* road grid */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1="0%" x2="100%" y1={`${(i + 1) * 11}%`} y2={`${(i + 1) * 11}%`} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" />
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`v${i}`} y1="0%" y2="100%" x1={`${(i + 1) * 9}%`} x2={`${(i + 1) * 9}%`} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" />
              ))}
              {/* diagonal highway */}
              <line x1="0%" y1="20%" x2="100%" y2="70%" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="3" />
              {/* hotspots */}
              {heatmapHotspots.map((h, i) => (
                <circle key={i} cx={`${h.x}%`} cy={`${h.y}%`} r="80" fill={`url(#hot-${i})`} />
              ))}
              {/* camera pins */}
              {cameras.map((c, i) => (
                <motion.g
                  key={c.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                >
                  <circle cx={`${c.lat}%`} cy={`${c.lng}%`} r="10" fill="#e8e8e8" />
                  <circle cx={`${c.lat}%`} cy={`${c.lng}%`} r="5" fill={c.status === "online" ? "#5ec48a" : c.status === "degraded" ? "#f0b95c" : "#e15a5a"} />
                </motion.g>
              ))}
            </svg>
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <SoftBadge tone="red">Hotspot</SoftBadge>
              <SoftBadge tone="green">Camera online</SoftBadge>
              <SoftBadge tone="gold">Degraded</SoftBadge>
              <SoftBadge tone="red">Offline</SoftBadge>
            </div>
          </div>
        </SoftCard>

        <div className="flex flex-col gap-6">
          <SoftCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
              Filters
            </div>
            <div className="flex flex-col gap-3 text-sm">
              {[
                ["Date range", "Last 7 days"],
                ["Vehicle", "All types"],
                ["Severity", "All"],
                ["Area", "Entire city"],
              ].map(([k, v]) => (
                <div key={k} className="soft-pressed-sm rounded-[18px] px-4 py-3">
                  <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                  <div className="font-bold">{v}</div>
                </div>
              ))}
            </div>
          </SoftCard>
          <SoftCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
              Top hotspot
            </div>
            <div className="font-bold text-xl">Main St & 5th</div>
            <div className="text-sm text-muted-foreground">
              48 detections this week · +12% vs last week
            </div>
          </SoftCard>
        </div>
      </div>
    </>
  );
}
