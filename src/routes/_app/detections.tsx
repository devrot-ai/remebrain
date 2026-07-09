import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Camera as CameraIcon } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { AnalyzerCard } from "@/components/AnalyzerCard";
import { listDetections } from "@/lib/detections.functions";

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
  return new Date(iso).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function FeedPage() {
  const listDet = useServerFn(listDetections);
  const { data: detections = [], isLoading } = useQuery({
    queryKey: ["detections", "all"],
    queryFn: () => listDet({ data: { limit: 100 } }),
    refetchInterval: 10000,
  });

  return (
    <>
      <TopBar title="Detection feed" subtitle="Every AI-flagged event, chronologically" />
      <div className="mb-6">
        <AnalyzerCard />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : detections.length === 0 ? (
        <SoftCard>
          <div className="text-center py-8 text-sm text-muted-foreground">
            No detections yet. Run the analyzer above or start a camera.
          </div>
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {detections.map((d) => (
            <SoftCard key={d.id} hover className="!p-5">
              <div className="flex gap-4">
                <div className="soft-pressed rounded-[20px] h-24 w-32 shrink-0 grid place-items-center">
                  <div className="text-brand-blue font-black text-sm">
                    {d.plate_guess || "—"}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold truncate">
                        {d.litter_type || (d.litter_detected ? "Litter" : "No litter")}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {d.vehicle_color} {d.vehicle}
                      </div>
                    </div>
                    <SoftBadge tone={d.litter_detected ? "red" : "green"}>
                      {d.litter_detected ? "violation" : "clean"}
                    </SoftBadge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1 truncate">
                      <Clock className="h-3 w-3 shrink-0" /> {fmt(d.created_at)}
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <CameraIcon className="h-3 w-3 shrink-0" />
                      {d.model.replace("google/", "")}
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
          ))}
        </div>
      )}
    </>
  );
}
