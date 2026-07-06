import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, AlertTriangle, Download } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftInput } from "@/components/soft/SoftInput";
import { detections } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/violations/$id")({
  loader: ({ params }) => {
    const d = detections.find((x) => x.id === params.id);
    if (!d) throw notFound();
    return { detection: d };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.detection.plate} · Violation ${loaderData.detection.id}`
          : "Violation",
      },
      { name: "description", content: "Officer review of an AI-flagged littering event." },
    ],
  }),
  component: ViolationDetail,
});

function ViolationDetail() {
  const { detection: d } = Route.useLoaderData();
  return (
    <>
      <TopBar title={`Violation ${d.id}`} subtitle={`Plate ${d.plate} · ${d.cameraName}`} />
      <Link
        to="/violations"
        className="soft-raised-sm soft-press rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to violations
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <SoftCard>
            <div className="soft-pressed rounded-[24px] aspect-video relative overflow-hidden">
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#cfd6e0,#8791a1)" }} />
              <div className="absolute left-0 right-0 bottom-0 h-1/2" style={{ background: "linear-gradient(180deg,#7b8492,#4a505a)" }} />
              <motion.div
                className="absolute bottom-[24%] left-[30%] h-10 w-24 rounded-md"
                style={{ background: "#3d4b6b" }}
                animate={{ x: [0, 40, 60] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* trash trajectory */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none">
                <path
                  d="M 45% 42% Q 55% 30% 68% 55%"
                  fill="none"
                  stroke="#e15a5a"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <circle cx="45%" cy="42%" r="4" fill="#e15a5a" />
                <circle cx="68%" cy="55%" r="4" fill="#e15a5a" />
                <rect x="28%" y="60%" width="24%" height="18%" fill="none" stroke="#4a86ff" strokeWidth="1.5" rx="3" />
                <rect x="60%" y="70%" width="12%" height="6%" fill="none" stroke="#5ec48a" strokeWidth="1.5" rx="2" />
              </svg>
              <div className="absolute top-3 left-3">
                <SoftBadge tone="red">Evidence · 00:04.2</SoftBadge>
              </div>
              <div className="absolute top-3 right-3">
                <SoftBadge tone="blue">Confidence {(d.confidence * 100).toFixed(0)}%</SoftBadge>
              </div>
            </div>
            <div className="soft-pressed-sm rounded-full h-3 mt-4 relative">
              <div className="absolute inset-y-0 left-0 rounded-full bg-brand-blue/50" style={{ width: "42%" }} />
              <div className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full soft-raised-sm bg-brand-blue" style={{ left: "42%" }} />
            </div>
            <div className="flex justify-between text-[10px] uppercase text-muted-foreground mt-2">
              <span>00:00</span>
              <span>00:12</span>
            </div>
          </SoftCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Approach", "Throw motion", "Ejection"].map((label, i) => (
              <div key={label} className="soft-raised rounded-[24px] p-3">
                <div className="soft-pressed rounded-2xl aspect-video mb-2 grid place-items-center text-xs text-muted-foreground">
                  Frame {i + 1}
                </div>
                <div className="text-xs font-bold">{label}</div>
              </div>
            ))}
          </div>

          <SoftCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
              AI Explanation
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Vehicle track <span className="font-bold">#{d.id}</span> was continuously
              followed for 3.2 s. Hand-motion module detected a right-side ejection
              gesture at frame 84, correlated with a small object appearing at trajectory
              origin matching the driver-side window. Trash classifier labelled the object
              as <span className="font-bold text-brand-red">{d.litter}</span> with{" "}
              <span className="font-bold">{(d.confidence * 100).toFixed(0)}%</span>{" "}
              confidence.
            </p>
          </SoftCard>
        </div>

        <div className="flex flex-col gap-6">
          <SoftCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Vehicle
            </div>
            <div className="font-bold text-xl">{d.color} {d.vehicle}</div>
            <div className="soft-pressed rounded-[20px] mt-4 p-4 text-center">
              <div className="text-[10px] uppercase text-muted-foreground">Plate</div>
              <div className="text-3xl font-black tracking-widest text-brand-blue">
                {d.plate}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="soft-pressed-sm rounded-2xl p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Camera</div>
                <div className="font-bold">{d.cameraName}</div>
              </div>
              <div className="soft-pressed-sm rounded-2xl p-3">
                <div className="text-[10px] uppercase text-muted-foreground">GPS</div>
                <div className="font-bold">{d.gps}</div>
              </div>
              <div className="soft-pressed-sm rounded-2xl p-3 col-span-2">
                <div className="text-[10px] uppercase text-muted-foreground">Owner</div>
                <div className="font-bold text-muted-foreground italic">
                  Retrieval requires officer credentials
                </div>
              </div>
            </div>
          </SoftCard>

          <SoftCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
              Officer decision
            </div>
            <div className="grid grid-cols-1 gap-2 mb-3">
              <SoftButton variant="success" icon={<Check className="h-4 w-4" />}>
                Approve violation
              </SoftButton>
              <SoftButton variant="danger" icon={<X className="h-4 w-4" />}>
                Reject
              </SoftButton>
              <SoftButton icon={<AlertTriangle className="h-4 w-4" />}>
                Mark false positive
              </SoftButton>
            </div>
            <label className="text-[10px] uppercase text-muted-foreground">
              Officer notes
            </label>
            <SoftInput placeholder="Add optional notes…" className="mt-1" />
            <SoftButton variant="primary" className="mt-4 w-full" icon={<Download className="h-4 w-4" />}>
              Download evidence pack
            </SoftButton>
          </SoftCard>
        </div>
      </div>
    </>
  );
}
