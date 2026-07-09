import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Check, X, AlertTriangle, Download, Clock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftInput } from "@/components/soft/SoftInput";
import { detections } from "@/lib/mock/data";
import { isVisionDetection } from "@/lib/vision/parser";
import type { VisionDetection } from "@/lib/vision/parser";
import { useVisionDetectionsContext } from "@/hooks/VisionDetectionsContext";
import { useReviewDecisions } from "@/hooks/ReviewDecisionsContext";
import { ViolationPreview } from "@/components/ViolationPreview";

export const Route = createFileRoute("/_app/violations/$id")({
  loader: ({ params }) => {
    // We only resolve mock data in the loader — Vision detections are
    // looked up client-side from the context for SSR compatibility.
    const d = detections.find((x) => x.id === params.id);
    return { detection: d ?? null, paramId: params.id };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.detection
          ? `${loaderData.detection.plate} · Violation ${loaderData.detection.id}`
          : "Violation",
      },
      { name: "description", content: "Officer review of an AI-flagged littering event." },
    ],
  }),
  component: ViolationDetail,
});

function ViolationDetail() {
  const { detection: mockDetection, paramId } = Route.useLoaderData();
  const { allDetections } = useVisionDetectionsContext();

  // Find the detection from either source
  const d = mockDetection ?? allDetections.find((x) => x.id === paramId);
  if (!d) throw notFound();

  const isVision = isVisionDetection(d);
  const visionMeta = isVision ? (d as VisionDetection).__visionMeta : null;

  return (
    <>
      <TopBar title={`Violation ${d.id}`} subtitle={`Plate ${d.plate} · ${d.cameraName}`} />
      <Link
        to="/violations"
        className="soft-raised-sm soft-press rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to violations
      </Link>

      {isVision && (
        <div className="soft-raised rounded-2xl px-4 py-2 mb-4 inline-flex items-center gap-2">
          <SoftBadge tone="blue">Vision AI Detection</SoftBadge>
          <span className="text-xs text-muted-foreground">
            Real inference from Google Cloud Vision API
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <SoftCard>
            <div className="soft-pressed rounded-[24px] aspect-video relative overflow-hidden">
              {isVision && visionMeta?.imageDataUri ? (
                <>
                  {/* Real uploaded image */}
                  <img
                    src={visionMeta.imageDataUri}
                    alt="Evidence"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* Bounding box overlays from Vision API */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none">
                    {visionMeta.allObjects.map((obj) => (
                      <g key={obj.id}>
                        <rect
                          x={`${obj.box.x}%`}
                          y={`${obj.box.y}%`}
                          width={`${obj.box.w}%`}
                          height={`${obj.box.h}%`}
                          fill="none"
                          stroke={obj.isLitter ? "#e15a5a" : "#4a86ff"}
                          strokeWidth={obj.isLitter ? 3 : 1.5}
                          rx={4}
                          style={
                            obj.isLitter
                              ? { filter: "drop-shadow(0 0 8px #e15a5a)" }
                              : undefined
                          }
                        />
                        <rect
                          x={`${obj.box.x}%`}
                          y={`${Math.max(0, obj.box.y - 4)}%`}
                          width={`${Math.max(obj.label.length * 1.4 + 6, 12)}%`}
                          height="4%"
                          fill={obj.isLitter ? "#e15a5a" : "#4a86ff"}
                          rx={2}
                          opacity={0.9}
                        />
                        <text
                          x={`${obj.box.x + 0.8}%`}
                          y={`${Math.max(0, obj.box.y - 1)}%`}
                          fontSize="10"
                          fill="white"
                          fontWeight="700"
                        >
                          {obj.label} {(obj.confidence * 100).toFixed(0)}%
                        </text>
                      </g>
                    ))}
                  </svg>
                </>
              ) : (
                <>
                  {/* Mock scene fallback */}
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
                </>
              )}
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

          {!isVision && (
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
          )}

          {isVision && visionMeta && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visionMeta.allObjects.slice(0, 3).map((obj) => (
                <div key={obj.id} className="soft-raised rounded-[24px] p-3">
                  <div className="soft-pressed rounded-2xl aspect-video mb-2 relative overflow-hidden">
                    <img
                      src={visionMeta.imageDataUri}
                      alt={obj.label}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <svg className="absolute inset-0 h-full w-full pointer-events-none">
                      <rect
                        x={`${obj.box.x}%`}
                        y={`${obj.box.y}%`}
                        width={`${obj.box.w}%`}
                        height={`${obj.box.h}%`}
                        fill="none"
                        stroke={obj.isLitter ? "#e15a5a" : "#4a86ff"}
                        strokeWidth={2}
                        rx={3}
                      />
                    </svg>
                  </div>
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{obj.label}</span>
                    <span className="text-brand-green">{(obj.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SoftCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
              AI Explanation
            </div>
            {isVision && visionMeta ? (
              <p className="text-sm leading-relaxed text-foreground">
                Google Cloud Vision API detected{" "}
                <span className="font-bold">{visionMeta.allObjects.length} objects</span>{" "}
                in the uploaded image.{" "}
                {visionMeta.allObjects.filter((o) => o.isLitter).length > 0 ? (
                  <>
                    <span className="font-bold text-brand-red">
                      {visionMeta.allObjects.filter((o) => o.isLitter).length} litter item(s)
                    </span>{" "}
                    were identified:{" "}
                    {visionMeta.allObjects
                      .filter((o) => o.isLitter)
                      .map((o) => `${o.litterCategory ?? o.label} (${(o.confidence * 100).toFixed(0)}%)`)
                      .join(", ")}
                    .
                  </>
                ) : (
                  <>
                    No litter items were detected with high confidence.
                    Top labels:{" "}
                    {visionMeta.labels
                      .slice(0, 5)
                      .map((l) => l.label)
                      .join(", ")}
                    .
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">
                Vehicle track <span className="font-bold">#{d.id}</span> was continuously
                followed for 3.2 s. Hand-motion module detected a right-side ejection
                gesture at frame 84, correlated with a small object appearing at trajectory
                origin matching the driver-side window. Trash classifier labelled the object
                as <span className="font-bold text-brand-red">{d.litter}</span> with{" "}
                <span className="font-bold">{(d.confidence * 100).toFixed(0)}%</span>{" "}
                confidence.
              </p>
            )}
          </SoftCard>

          {/* Violation Report Preview — maps inference JSON → report fields */}
          <ViolationPreview detection={d} />
        </div>

        <div className="flex flex-col gap-6">
          <SoftCard>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {isVision ? "Detection" : "Vehicle"}
            </div>
            <div className="font-bold text-xl">{isVision ? d.litter : `${d.color} ${d.vehicle}`}</div>
            <div className="soft-pressed rounded-[20px] mt-4 p-4 text-center">
              <div className="text-[10px] uppercase text-muted-foreground">
                {isVision ? "Source" : "Plate"}
              </div>
              <div className="text-3xl font-black tracking-widest text-brand-blue">
                {isVision ? "VISION AI" : d.plate}
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
                <div className="text-[10px] uppercase text-muted-foreground">
                  {isVision ? "Confidence" : "Owner"}
                </div>
                <div className="font-bold text-muted-foreground italic">
                  {isVision
                    ? `${(d.confidence * 100).toFixed(1)}% — ${d.severity} severity`
                    : "Retrieval requires officer credentials"}
                </div>
              </div>
            </div>
          </SoftCard>

          <ViolationDetailDecisionPanel detectionId={d.id} />
        </div>
      </div>
    </>
  );
}

/** Officer decision panel with working actions and decision log. */
function ViolationDetailDecisionPanel({
  detectionId,
}: {
  detectionId: string;
}) {
  const { decide, getDecision } = useReviewDecisions();
  const [notes, setNotes] = useState("");
  const decision = getDecision(detectionId);

  const handleAction = (action: "approved" | "rejected" | "false_positive") => {
    decide(detectionId, action, notes.trim() || undefined);
    setNotes("");
  };

  return (
    <SoftCard>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
        Officer decision
      </div>

      {decision ? (
        /* ── Decision recorded ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`soft-pressed rounded-[20px] p-5 text-center mb-3 ${
              decision.action === "approved"
                ? "text-brand-green"
                : decision.action === "rejected"
                  ? "text-brand-red"
                  : "text-brand-blue"
            }`}
          >
            <div className="h-12 w-12 rounded-2xl soft-raised-sm grid place-items-center mx-auto mb-3">
              {decision.action === "approved" ? (
                <Check className="h-6 w-6" />
              ) : decision.action === "rejected" ? (
                <X className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div className="text-lg font-black uppercase tracking-wider">
              {decision.action === "approved"
                ? "Approved"
                : decision.action === "rejected"
                  ? "Rejected"
                  : "False Positive"}
            </div>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(decision.timestamp).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              by {decision.officerName}
            </div>
            {decision.notes && (
              <div className="soft-pressed-sm rounded-xl p-3 mt-3 text-xs text-left text-muted-foreground">
                <span className="font-bold text-foreground">Notes: </span>
                {decision.notes}
              </div>
            )}
          </div>

          {/* Allow changing decision */}
          <button
            onClick={() => decide(detectionId, "approved")}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors text-center py-1"
            style={{ display: "none" }}
          >
            Change decision
          </button>
        </motion.div>
      ) : (
        /* ── Pending — show action buttons ── */
        <>
          <div className="grid grid-cols-1 gap-2 mb-3">
            <SoftButton
              variant="success"
              icon={<Check className="h-4 w-4" />}
              onClick={() => handleAction("approved")}
            >
              Approve violation
            </SoftButton>
            <SoftButton
              variant="danger"
              icon={<X className="h-4 w-4" />}
              onClick={() => handleAction("rejected")}
            >
              Reject
            </SoftButton>
            <SoftButton
              icon={<AlertTriangle className="h-4 w-4" />}
              onClick={() => handleAction("false_positive")}
            >
              Mark false positive
            </SoftButton>
          </div>
          <label className="text-[10px] uppercase text-muted-foreground">
            Officer notes
          </label>
          <SoftInput
            placeholder="Add optional notes…"
            className="mt-1"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNotes(e.target.value)
            }
          />
          <SoftButton
            variant="primary"
            className="mt-4 w-full"
            icon={<Download className="h-4 w-4" />}
          >
            Download evidence pack
          </SoftButton>
        </>
      )}
    </SoftCard>
  );
}
