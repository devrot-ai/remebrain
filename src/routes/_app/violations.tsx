import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftInput } from "@/components/soft/SoftInput";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listViolations } from "@/lib/violations.functions";

const PAGE_SIZE = 25;

const violationsSearchSchema = z.object({
  filter: fallback(z.enum(["pending", "reviewed"]), "pending").default("pending"),
  plate: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
  page: fallback(z.number().int(), 1).default(1),
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
  const { filter, plate, from, to, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const list = useServerFn(listViolations);

  const [plateInput, setPlateInput] = useState(plate);
  useEffect(() => setPlateInput(plate), [plate]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (plateInput !== plate) {
        navigate({ search: (prev: any) => ({ ...prev, plate: plateInput, page: 1 }) });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [plateInput, plate, navigate]);

  const fromIso = from ? new Date(from).toISOString() : "";
  const toIso = to ? new Date(`${to}T23:59:59.999`).toISOString() : "";

  const { data, isLoading } = useQuery({
    queryKey: ["violations", filter, plate, fromIso, toIso, page],
    queryFn: () =>
      list({
        data: {
          filter,
          plate: plate || undefined,
          from: fromIso || undefined,
          to: toIso || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    refetchInterval: 10000,
  });

  const violations = data && "rows" in data ? data.rows : [];
  const total = data && "total" in data ? data.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total);

  const hasFilters = plate || from || to;
  const emptyMessage = hasFilters
    ? "No violations match your filters."
    : filter === "pending"
      ? "No violations pending review."
      : "No reviewed violations yet.";

  const goToPage = (p: number) =>
    navigate({ search: (prev: any) => ({ ...prev, page: Math.min(Math.max(p, 1), totalPages) }) });


  return (
    <>
      <TopBar title="Violations" subtitle="Full log of AI-recorded events" />
      <Tabs
        value={filter}
        onValueChange={(value) =>
          navigate({ search: (prev: any) => ({ ...prev, filter: value as "pending" | "reviewed", page: 1 }) })
        }
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="reviewed">Approved / Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <SoftCard className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              License plate
            </label>
            <SoftInput
              placeholder="Search plate…"
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              From
            </label>
            <SoftInput
              type="date"
              value={from}
              onChange={(e) =>
                navigate({ search: (prev: any) => ({ ...prev, from: e.target.value, page: 1 }) })
              }
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              To
            </label>
            <SoftInput
              type="date"
              value={to}
              onChange={(e) =>
                navigate({ search: (prev: any) => ({ ...prev, to: e.target.value, page: 1 }) })
              }
            />
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={() =>
                navigate({ search: (prev: any) => ({ ...prev, plate: "", from: "", to: "", page: 1 }) })
              }
              className="soft-raised-sm soft-press rounded-xl px-3 py-2 text-xs font-bold text-brand-blue"
            >
              Clear
            </button>
          ) : null}
        </div>
      </SoftCard>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : violations.length === 0 ? (
        <SoftCard>
          <div className="text-center py-8 text-sm text-muted-foreground">
            {emptyMessage}
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
