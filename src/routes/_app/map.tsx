import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { WebcamCaptureCard } from "@/components/WebcamCaptureCard";
import { listCameras } from "@/lib/cameras.functions";

export const Route = createFileRoute("/_app/map")({
  head: () => ({
    meta: [
      { title: "Camera Map — LitterCam AI" },
      { name: "description", content: "Every camera on one map with its live feed and auto-analysis toggle." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const list = useServerFn(listCameras);
  const qc = useQueryClient();
  const { data: cameras = [] } = useQuery({ queryKey: ["cameras"], queryFn: () => list() });
  const [selected, setSelected] = useState<string | null>(null);
  const cam = cameras.find((c) => c.id === selected) ?? cameras[0];

  const withPos = cameras.filter((c) => c.lat != null && c.lng != null);
  const lats = withPos.map((c) => c.lat as number);
  const lngs = withPos.map((c) => c.lng as number);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const pos = (c: (typeof cameras)[number], i: number) => {
    if (c.lat == null || c.lng == null) return { x: 15 + ((i * 23) % 70), y: 20 + ((i * 37) % 60) };
    const x = maxLng === minLng ? 50 : 10 + ((c.lng - minLng) / (maxLng - minLng)) * 80;
    const y = maxLat === minLat ? 50 : 10 + ((maxLat - c.lat) / (maxLat - minLat)) * 80;
    return { x, y };
  };

  return (
    <>
      <TopBar title="Camera map" subtitle="Pick a camera to watch its feed and analyze automatically" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SoftCard>
          <div className="soft-pressed rounded-[24px] aspect-square relative overflow-hidden">
            <svg className="absolute inset-0 h-full w-full opacity-40">
              {Array.from({ length: 10 }).map((_, i) => (
                <g key={i}>
                  <line x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="currentColor" strokeWidth="0.5" />
                  <line y1={`${i * 10}%`} x1="0" y2={`${i * 10}%`} x2="100%" stroke="currentColor" strokeWidth="0.5" />
                </g>
              ))}
            </svg>
            {cameras.map((c, i) => {
              const p = pos(c, i);
              const active = cam?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl px-3 py-2 text-xs font-bold flex items-center gap-1 ${active ? "soft-pressed-sm text-brand-blue" : "soft-raised-sm"}`}
                >
                  <MapPin className="h-3.5 w-3.5" /> {c.name}
                </button>
              );
            })}
            {cameras.length === 0 && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Add a camera on the Live Cameras page.</div>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-3">Cameras without coordinates are placed approximately.</div>
        </SoftCard>
        {cam && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SoftBadge tone={cam.active ? "green" : "red"}>{cam.active ? "Active" : "Offline"}</SoftBadge>
              <span className="text-sm font-bold">{cam.name}</span>
              <span className="text-xs text-muted-foreground">{cam.location}</span>
            </div>
            <WebcamCaptureCard
              key={cam.id}
              cameraId={cam.id}
              intervalSec={cam.capture_interval_sec ?? 5}
              onCapture={() => qc.invalidateQueries({ queryKey: ["violations"] })}
            />
          </div>
        )}
      </div>
    </>
  );
}
