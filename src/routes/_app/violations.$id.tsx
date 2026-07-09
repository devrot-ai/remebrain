import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { getViolation, updateViolationStatus } from "@/lib/violations.functions";
import { getFrameSignedUrl } from "@/lib/detections.functions";

export const Route = createFileRoute("/_app/violations/$id")({
  head: () => ({ meta: [{ title: "Violation — LitterCam AI" }] }),
  component: ViolationDetail,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-brand-red">{error.message}</div>
  ),
});

function ViolationDetail() {
  const { id } = Route.useParams();
  const get = useServerFn(getViolation);
  const update = useServerFn(updateViolationStatus);
  const signUrl = useServerFn(getFrameSignedUrl);
  const qc = useQueryClient();

  const { data: v, isLoading } = useQuery({
    queryKey: ["violation", id],
    queryFn: () => get({ data: { id } }),
  });

  const det = (v as any)?.detections as
    | {
        vehicle: string | null;
        vehicle_color: string | null;
        litter_type: string | null;
        confidence: number;
        model: string;
        reasoning: string | null;
        severity: string;
        frame_id: string | null;
      }
    | undefined;
  const cam = (v as any)?.cameras as { name: string; location: string | null } | undefined;

  const { data: imageUrl } = useQuery({
    queryKey: ["frame-url", (v as any)?.detection_id],
    enabled: !!v,
    queryFn: async () => {
      const supa = (await import("@/integrations/supabase/client")).supabase;
      if (!(v as any)?.detections?.frame_id) return null;
      const { data: frame } = await supa
        .from("frames")
        .select("storage_path")
        .eq("id", (v as any).detections.frame_id)
        .maybeSingle();
      if (!frame?.storage_path) return null;
      return signUrl({ data: { path: frame.storage_path } });
    },
  });

  const mut = useMutation({
    mutationFn: (status: "confirmed" | "dismissed" | "pending") =>
      update({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["violation", id] });
      qc.invalidateQueries({ queryKey: ["violations"] });
    },
  });

  if (isLoading || !v) {
    return (
      <>
        <TopBar title="Violation" subtitle="Loading…" />
      </>
    );
  }

  return (
    <>
      <TopBar
        title={`Violation ${id.slice(0, 8)}`}
        subtitle={`${v.plate_guess ?? "no plate"} · ${cam?.name ?? "camera"}`}
      />
      <Link
        to="/violations"
        className="soft-raised-sm soft-press rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to violations
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SoftCard className="xl:col-span-2">
          <div className="soft-pressed rounded-[24px] aspect-video overflow-hidden mb-4">
            {imageUrl ? (
              <img src={imageUrl} alt="Captured frame" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                No frame image available
              </div>
            )}
          </div>
          {det?.reasoning && (
            <div className="text-sm text-muted-foreground leading-relaxed">
              <span className="uppercase tracking-wider text-[10px] font-bold text-foreground/70">
                AI reasoning ·
              </span>{" "}
              {det.reasoning}
            </div>
          )}
        </SoftCard>

        <div className="flex flex-col gap-4">
          <SoftCard>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Details
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <Field label="Plate" value={v.plate_guess || "—"} />
              <Field label="Status" value={v.status} />
              <Field label="Severity" value={v.severity} />
              <Field
                label="Confidence"
                value={det ? `${(det.confidence * 100).toFixed(0)}%` : "—"}
              />
              <Field label="Vehicle" value={det ? `${det.vehicle_color ?? ""} ${det.vehicle ?? ""}`.trim() || "—" : "—"} />
              <Field label="Litter" value={det?.litter_type || "—"} />
              <Field label="Model" value={det?.model ?? "—"} />
              <Field label="Camera" value={cam?.name ?? "—"} />
            </dl>
          </SoftCard>

          <SoftCard>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Review
            </div>
            <div className="flex flex-col gap-2">
              <SoftButton
                variant="primary"
                onClick={() => mut.mutate("confirmed")}
                disabled={mut.isPending}
                icon={<Check className="h-4 w-4" />}
              >
                Confirm violation
              </SoftButton>
              <SoftButton
                variant="ghost"
                onClick={() => mut.mutate("dismissed")}
                disabled={mut.isPending}
                icon={<X className="h-4 w-4" />}
              >
                Dismiss (false positive)
              </SoftButton>
              {v.status !== "pending" && (
                <button
                  onClick={() => mut.mutate("pending")}
                  className="text-xs text-muted-foreground underline mt-1"
                >
                  Reset to pending
                </button>
              )}
            </div>
          </SoftCard>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-pressed-sm rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-bold truncate">{value}</div>
    </div>
  );
}
