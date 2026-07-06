import { createFileRoute } from "@tanstack/react-router";
import { FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftButton } from "@/components/soft/SoftButton";
import { detections } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — LitterCam AI" },
      { name: "description", content: "Generate and export enforcement reports." },
    ],
  }),
  component: ReportsPage,
});

const periods = ["Daily", "Weekly", "Monthly", "Yearly"] as const;

function toCsv() {
  const header = "id,plate,vehicle,litter,camera,confidence,status,timestamp";
  const rows = detections.map((d) =>
    [d.id, d.plate, `${d.color} ${d.vehicle}`, d.litter, d.cameraName, (d.confidence * 100).toFixed(0) + "%", d.status, d.timestamp].join(","),
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "littercam-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  return (
    <>
      <TopBar title="Reports" subtitle="Generate summaries for command staff" />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {periods.map((p) => (
          <SoftCard key={p} hover className="text-center !p-6">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Generate
            </div>
            <div className="text-2xl font-black text-brand-blue mt-1">{p}</div>
            <div className="mt-3 text-xs text-muted-foreground">
              Snapshot of enforcement metrics for the {p.toLowerCase()} period.
            </div>
            <SoftButton variant="primary" size="sm" className="mt-4 w-full">
              Generate
            </SoftButton>
          </SoftCard>
        ))}
      </div>

      <SoftCard>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Export current dataset
            </div>
            <h2 className="font-bold text-lg">{detections.length} records ready</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <SoftButton variant="primary" icon={<FileDown className="h-4 w-4" />} onClick={toCsv}>
              CSV
            </SoftButton>
            <SoftButton icon={<FileSpreadsheet className="h-4 w-4" />} onClick={toCsv}>
              Excel
            </SoftButton>
            <SoftButton icon={<FileText className="h-4 w-4" />}>
              PDF
            </SoftButton>
          </div>
        </div>
        <div className="soft-pressed rounded-[24px] p-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Reports include violation ID, license plate, vehicle, litter type, camera,
            confidence, officer decision, and timestamp. All exports respect officer
            review status — pending violations are marked as unresolved.
          </p>
        </div>
      </SoftCard>
    </>
  );
}
