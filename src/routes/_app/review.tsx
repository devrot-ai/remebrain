import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, AlertTriangle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { useVisionDetectionsContext } from "@/hooks/VisionDetectionsContext";
import { isVisionDetection } from "@/lib/vision/parser";
import { ViolationPreview } from "@/components/ViolationPreview";
import type { Detection } from "@/lib/mock/data";

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

/** Individual review card with expandable violation preview. */
function ReviewCard({ d, index }: { d: Detection; index: number }) {
  const [showPreview, setShowPreview] = useState(false);
  const visionMeta = isVisionDetection(d) ? d.__visionMeta : null;
  const isVision = visionMeta !== null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <SoftCard hover>
        <div className="soft-pressed rounded-[24px] aspect-video mb-4 relative overflow-hidden">
          {isVision && visionMeta?.imageDataUri ? (
            <>
              <img
                src={visionMeta.imageDataUri}
                alt="Detection"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Bounding box overlays */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none">
                {visionMeta.allObjects.map((obj) => (
                  <rect
                    key={obj.id}
                    x={`${obj.box.x}%`}
                    y={`${obj.box.y}%`}
                    width={`${obj.box.w}%`}
                    height={`${obj.box.h}%`}
                    fill="none"
                    stroke={obj.isLitter ? "#e15a5a" : "#4a86ff"}
                    strokeWidth={obj.isLitter ? 3 : 1.5}
                    rx={3}
                  />
                ))}
              </svg>
            </>
          ) : (
            <>
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#cfd6e0,#8791a1)" }} />
              <div className="absolute left-0 right-0 bottom-0 h-1/2" style={{ background: "#565d68" }} />
              <svg className="absolute inset-0 h-full w-full">
                <rect x="28%" y="48%" width="34%" height="30%" fill="none" stroke="#4a86ff" strokeWidth="1.5" rx="3" />
              </svg>
            </>
          )}
          <div className="absolute top-2 left-2">
            <SoftBadge tone="red">
              {isVision ? "Vision AI" : "Litter"}
            </SoftBadge>
          </div>
          <div className="absolute bottom-2 right-2 soft-raised-sm rounded-lg px-2 py-1 text-[10px] font-black text-brand-blue">
            {d.plate}
          </div>
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

        {/* Violation Preview Toggle */}
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="w-full soft-raised-sm soft-press rounded-xl px-3 py-2 mb-3 flex items-center justify-between text-left transition-all"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-brand-blue">
            <FileText className="h-3.5 w-3.5" />
            Report Preview
          </span>
          {showPreview ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mb-3"
            >
              <ViolationPreview detection={d} compact />
            </motion.div>
          )}
        </AnimatePresence>

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
  );
}

function ReviewPage() {
  const { allDetections } = useVisionDetectionsContext();
  const queue = allDetections.filter((d) => d.status === "pending");

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
          <ReviewCard key={d.id} d={d} index={i} />
        ))}
      </div>
    </>
  );
}
