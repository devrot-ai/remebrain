import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { detections } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/violations")({
  head: () => ({
    meta: [
      { title: "Violations — LitterCam AI" },
      { name: "description", content: "All recorded littering violations awaiting or completed review." },
    ],
  }),
  component: ViolationsPage,
});

function ViolationsPage() {
  return (
    <>
      <TopBar title="Violations" subtitle="Full log of AI-recorded events" />
      <SoftCard padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="text-left p-4">ID</th>
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
              {detections.map((d) => (
                <tr key={d.id} className="border-t border-border/60">
                  <td className="p-4 font-mono text-xs text-muted-foreground">{d.id}</td>
                  <td className="p-4 font-black text-brand-blue">{d.plate}</td>
                  <td className="p-4">{d.color} {d.vehicle}</td>
                  <td className="p-4 text-muted-foreground">{d.litter}</td>
                  <td className="p-4 text-muted-foreground">{d.cameraName}</td>
                  <td className="p-4 font-bold text-brand-green">
                    {(d.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="p-4">
                    <SoftBadge
                      tone={
                        d.status === "pending"
                          ? "gold"
                          : d.status === "approved"
                            ? "green"
                            : d.status === "false_positive"
                              ? "blue"
                              : "red"
                      }
                    >
                      {d.status}
                    </SoftBadge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to="/violations/$id"
                      params={{ id: d.id }}
                      className="soft-raised-sm soft-press rounded-xl px-3 py-1.5 text-xs font-bold text-brand-blue"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SoftCard>
    </>
  );
}
