import { createFileRoute } from "@tanstack/react-router";
import { Check, X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { detections } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/review")({
  head: () => ({
    meta: [
      { title: "Human Review — LitterCam AI" },
      {
        name: "description",
        content: "Officer review queue. Humans make the final decision on every violation.",
      },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const queue = detections.filter((d) => d.status === "pending");
  return (
    <>
      <TopBar
        title="Human review queue"
        subtitle="Every AI detection requires officer approval before any action"
      />

      <SoftCard className="mb-6 !p-4 flex items-center gap-4">
        <div className="soft-pressed-sm h-10 w-10 rounded-2xl grid place-items-center text-brand-blue">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-sm text-foreground">
          <span className="font-bold">Humans decide.</span> AI provides evidence and
          confidence — no penalty is issued without officer approval.
        </p>
      </SoftCard>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {queue.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <SoftCard hover>
              <div className="soft-pressed rounded-[24px] aspect-video mb-4 relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#cfd6e0,#8791a1)" }} />
                <div className="absolute left-0 right-0 bottom-0 h-1/2" style={{ background: "#565d68" }} />
                <div className="absolute top-2 left-2">
                  <SoftBadge tone="red">Litter</SoftBadge>
                </div>
                <div className="absolute bottom-2 right-2 soft-raised-sm rounded-lg px-2 py-1 text-[10px] font-black text-brand-blue">
                  {d.plate}
                </div>
                <svg className="absolute inset-0 h-full w-full">
                  <rect x="28%" y="48%" width="34%" height="30%" fill="none" stroke="#4a86ff" strokeWidth="1.5" rx="3" />
                </svg>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <div className="font-bold truncate">{d.litter}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {d.cameraName}
                  </div>
                </div>
                <SoftBadge tone="green">{(d.confidence * 100).toFixed(0)}%</SoftBadge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <SoftButton variant="success" size="sm" icon={<Check className="h-3.5 w-3.5" />}>
                  Approve
                </SoftButton>
                <SoftButton variant="danger" size="sm" icon={<X className="h-3.5 w-3.5" />}>
                  Reject
                </SoftButton>
                <SoftButton size="sm" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                  More
                </SoftButton>
              </div>
            </SoftCard>
          </motion.div>
        ))}
      </div>
    </>
  );
}
