import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, X, AlertTriangle, Radio } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftInput } from "@/components/soft/SoftInput";
import { listViolations, updateViolationStatus } from "@/lib/violations.functions";

export const Route = createFileRoute("/_app/review")({
  head: () => ({
    meta: [
      { title: "Officer Dashboard — LitterCam AI" },
      { name: "description", content: "Live violations feed. Officers approve or reject every AI detection." },
    ],
  }),
  component: ReviewPage,
});

type Row = Awaited<ReturnType<typeof listViolations>>["rows"][number];

function ReviewPage() {
  const list = useServerFn(listViolations);
  const { data, isLoading } = useQuery({
    queryKey: ["violations", "live-queue"],
    queryFn: () => list({ data: { filter: "pending", pageSize: 50 } }),
    refetchInterval: 5000,
  });
  const rows = data?.rows ?? [];

  return (
    <>
      <TopBar title="Officer dashboard" subtitle="Live feed of violations awaiting your decision" />
      <SoftCard className="mb-6 !p-4 flex items-center gap-4">
        <div className="soft-pressed-sm h-10 w-10 rounded-2xl grid place-items-center text-brand-blue">
          <Radio className="h-4 w-4 animate-pulse" />
        </div>
        <p className="text-sm flex-1">
          <span className="font-bold">Live · refreshes every 5s.</span> Fix the plate before approving —
          your corrections teach the AI real plates.
        </p>
        <SoftBadge tone="gold">{rows.length} pending</SoftBadge>
      </SoftCard>

      {isLoading && <div className="text-sm text-muted-foreground">Loading queue…</div>}
      {!isLoading && rows.length === 0 && (
        <SoftCard className="text-center text-sm text-muted-foreground">Queue is clear. New violations appear here automatically.</SoftCard>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rows.map((v) => <QueueCard key={v.id} v={v} />)}
      </div>
    </>
  );
}

function QueueCard({ v }: { v: Row }) {
  const update = useServerFn(updateViolationStatus);
  const qc = useQueryClient();
  const [plate, setPlate] = useState(v.plate_guess ?? "");
  const [busy, setBusy] = useState(false);
  const det = (Array.isArray(v.detections) ? v.detections[0] : v.detections) as
    | { litter_type?: string | null; confidence?: number; reasoning?: string | null; vehicle?: string | null; vehicle_color?: string | null }
    | null;
  const cam = v.cameras as { name?: string } | null;

  const decide = async (status: "confirmed" | "dismissed") => {
    const label = status === "confirmed" ? "Approve" : "Reject";
    if (!window.confirm(`${label} this violation? Your officer ID and time will be recorded.`)) return;
    setBusy(true);
    try {
      await update({ data: { id: v.id, status, correct_plate: status === "confirmed" ? plate : null } });
      toast.success(status === "confirmed" ? "Violation approved" : "Violation rejected");
      qc.invalidateQueries({ queryKey: ["violations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SoftCard>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0">
          <div className="font-bold truncate">{det?.litter_type || "Litter"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {cam?.name ?? "Camera"} · {new Date(v.created_at).toLocaleTimeString()}
          </div>
        </div>
        <SoftBadge tone={v.severity === "high" ? "red" : v.severity === "medium" ? "gold" : "green"}>
          {((det?.confidence ?? 0) * 100).toFixed(0)}%
        </SoftBadge>
      </div>
      {det?.reasoning && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{det.reasoning}</p>}
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Plate (AI read: {v.plate_guess || "none"})</label>
      <SoftInput value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Correct plate" className="mb-3 mt-1" />
      <div className="grid grid-cols-3 gap-2">
        <SoftButton variant="success" size="sm" disabled={busy} onClick={() => decide("confirmed")} icon={<Check className="h-3.5 w-3.5" />}>Approve</SoftButton>
        <SoftButton variant="danger" size="sm" disabled={busy} onClick={() => decide("dismissed")} icon={<X className="h-3.5 w-3.5" />}>Reject</SoftButton>
        <Link to="/violations/$id" params={{ id: v.id }} className="soft-raised-sm soft-press rounded-[20px] text-xs font-bold grid place-items-center">
          <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />More</span>
        </Link>
      </div>
    </SoftCard>
  );
}
