import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Clock, Camera as CameraIcon } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { detections } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/detections")({
  head: () => ({
    meta: [
      { title: "Detection Feed — LitterCam AI" },
      { name: "description", content: "Live timeline of AI-detected littering events." },
    ],
  }),
  component: FeedPage,
});

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

function FeedPage() {
  return (
    <>
      <TopBar title="Detection feed" subtitle="Every AI-flagged event, chronologically" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {detections.map((d) => (
          <Link
            key={d.id}
            to="/violations/$id"
            params={{ id: d.id }}
            className="block"
          >
            <SoftCard hover className="!p-5">
              <div className="flex gap-4">
                <div className="soft-pressed rounded-[20px] h-24 w-32 shrink-0 grid place-items-center relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#c9d0da,#8993a4)" }} />
                  <div className="relative text-brand-blue font-black text-sm">{d.plate}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{d.litter}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {d.color} {d.vehicle} · Track #{d.id}
                      </div>
                    </div>
                    <SoftBadge tone={d.status === "pending" ? "gold" : d.status === "approved" ? "green" : "red"}>
                      {d.status}
                    </SoftBadge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1 truncate">
                      <Clock className="h-3 w-3 shrink-0" /> {fmt(d.timestamp)}
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> {d.gps}
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <CameraIcon className="h-3 w-3 shrink-0" /> {d.cameraName}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="soft-pressed-sm h-2 rounded-full flex-1 overflow-hidden">
                      <div
                        className="h-full bg-brand-blue/70 rounded-full"
                        style={{ width: `${d.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-brand-blue">
                      {(d.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </SoftCard>
          </Link>
        ))}
      </div>
    </>
  );
}
