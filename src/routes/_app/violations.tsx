import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listViolations } from "@/lib/violations.functions";

const violationsSearchSchema = z.object({
  filter: fallback(z.enum(["pending", "reviewed"]), "pending").default("pending"),
});

export const Route = createFileRoute("/_app/violations")({
  validateSearch: zodValidator(violationsSearchSchema),
  head: () => ({
    meta: [
      { title: "Violations — LitterCam AI" },
      { name: "description", content: "All recorded littering violations awaiting or completed review." },
    ],
  }),
  component: ViolationsPage,
});

function ViolationsPage() {
  const list = useServerFn(listViolations);
  const { data: violations = [], isLoading } = useQuery({
    queryKey: ["violations"],
    queryFn: () => list(),
    refetchInterval: 10000,
  });

  return (
    <>
      <TopBar title="Violations" subtitle="Full log of AI-recorded events" />
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : violations.length === 0 ? (
        <SoftCard>
          <div className="text-center py-8 text-sm text-muted-foreground">
            No violations recorded yet.
          </div>
        </SoftCard>
      ) : (
        <SoftCard padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="text-left p-4">When</th>
                  <th className="text-left p-4">Plate</th>
                  <th className="text-left p-4">Vehicle</th>
                  <th className="text-left p-4">Litter</th>
                  <th className="text-left p-4">Camera</th>
                  <th className="text-left p-4">Confidence</th>
                  <th className="text-left p-4">Status</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => {
                  const det = (v as any).detections;
                  const cam = (v as any).cameras;
                  return (
                    <tr key={v.id} className="border-t border-border/60">
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-black text-brand-blue">
                        {v.plate_guess || "—"}
                      </td>
                      <td className="p-4">
                        {det ? `${det.vehicle_color ?? ""} ${det.vehicle ?? ""}`.trim() || "—" : "—"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {det?.litter_type || "—"}
                      </td>
                      <td className="p-4 text-muted-foreground">{cam?.name || "—"}</td>
                      <td className="p-4 font-bold text-brand-green">
                        {det ? `${(det.confidence * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td className="p-4">
                        <SoftBadge
                          tone={
                            v.status === "pending"
                              ? "gold"
                              : v.status === "confirmed"
                                ? "green"
                                : "red"
                          }
                        >
                          {v.status}
                        </SoftBadge>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to="/violations/$id"
                          params={{ id: v.id }}
                          className="soft-raised-sm soft-press rounded-xl px-3 py-1.5 text-xs font-bold text-brand-blue"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SoftCard>
      )}
    </>
  );
}
