import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { WebcamCaptureCard } from "@/components/WebcamCaptureCard";
import { getCamera } from "@/lib/cameras.functions";
import { listDetections } from "@/lib/detections.functions";

export const Route = createFileRoute("/_app/cameras/$id")({
  head: () => ({
    meta: [{ title: "Camera live — LitterCam AI" }],
  }),
  component: CameraDetailPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-brand-red">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Camera not found.</div>,
});

function CameraDetailPage() {
  const { id } = Route.useParams();
  const getCam = useServerFn(getCamera);
  const listDet = useServerFn(listDetections);
  const qc = useQueryClient();

  const { data: camera } = useQuery({
    queryKey: ["camera", id],
    queryFn: () => getCam({ data: { id } }),
  });

  const { data: detections = [] } = useQuery({
    queryKey: ["detections", "camera", id],
    queryFn: () => listDet({ data: { camera_id: id, limit: 20 } }),
    refetchInterval: 5000,
  });

  if (!camera) {
    return (
      <>
        <TopBar title="Camera" subtitle="Loading…" />
        <div className="text-sm text-muted-foreground">Loading camera…</div>
      </>
    );
  }

  return (
    <>
      <TopBar title={camera.name} subtitle={camera.location ?? "Live camera"} />
      <Link
        to="/cameras"
        className="soft-raised-sm soft-press rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All cameras
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <WebcamCaptureCard
            cameraId={camera.id}
            intervalSec={camera.capture_interval_sec ?? 5}
            onCapture={() => {
              qc.invalidateQueries({ queryKey: ["detections", "camera", id] });
              qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
              qc.invalidateQueries({ queryKey: ["violations"] });
            }}
          />
        </div>

        <SoftCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Recent detections
              </div>
              <h2 className="text-lg font-bold">Live feed</h2>
            </div>
            <SoftBadge tone="blue">{detections.length}</SoftBadge>
          </div>
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {detections.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6">
                No detections yet. Start the camera to begin.
              </div>
            )}
            {detections.map((d) => (
              <div key={d.id} className="soft-pressed-sm rounded-2xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <SoftBadge tone={d.litter_detected ? "red" : "green"}>
                    {d.litter_detected ? "Violation" : "Clean"}
                  </SoftBadge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(d.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="font-bold">
                    {(d.confidence * 100).toFixed(0)}%
                  </span>{" "}
                  · {d.litter_type || "no litter"}
                  {d.plate_guess ? ` · plate ${d.plate_guess}` : ""}
                </div>
                {d.reasoning && (
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {d.reasoning}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SoftCard>
      </div>
    </>
  );
}
