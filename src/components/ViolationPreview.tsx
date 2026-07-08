/**
 * Violation Preview — maps raw inference JSON into the intended
 * Violation / Report fields that would be filed before human review.
 *
 * Works for both Vision API detections and mock/simulated detections.
 * Displays a structured, form-like preview of every field an officer
 * would see in the final enforcement report.
 */

import { motion } from "framer-motion";
import {
  FileText,
  MapPin,
  Camera as CameraIcon,
  Clock,
  Shield,
  AlertTriangle,
  Tag,
  Hash,
  Car,
  Palette,
  Eye,
  Gauge,
  ChevronRight,
  Layers,
  Scale,
} from "lucide-react";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import type { Detection } from "@/lib/mock/data";
import { isVisionDetection, type VisionMeta } from "@/lib/vision/parser";

// ── Report-field mapping logic ──────────────────────────────────────

interface ViolationReportFields {
  /** Auto-generated report / case ID */
  reportId: string;
  /** Violation type classification */
  violationType: string;
  /** Specific litter category */
  litterCategory: string;
  /** Severity level */
  severity: "low" | "medium" | "high";
  /** Suggested fine tier */
  suggestedFineTier: string;
  /** Detection source */
  source: string;
  /** Model confidence */
  confidence: number;
  /** Risk score (0–100) */
  riskScore: number;
  /** Camera / source info */
  camera: string;
  /** Camera zone ID */
  cameraId: string;
  /** GPS coordinates */
  gps: string;
  /** Incident timestamp */
  timestamp: string;
  /** Vehicle plate */
  plate: string;
  /** Vehicle type */
  vehicleType: string;
  /** Vehicle color */
  vehicleColor: string;
  /** Number of objects detected in the scene */
  objectCount: number;
  /** All label strings from inference */
  detectedLabels: string[];
  /** Litter items specifically found */
  litterItems: Array<{ label: string; confidence: number }>;
  /** Non-litter context objects */
  contextObjects: Array<{ label: string; confidence: number }>;
  /** Evidence strength assessment */
  evidenceStrength: "strong" | "moderate" | "weak";
  /** Human-readable evidence summary */
  evidenceSummary: string;
  /** Review status */
  status: Detection["status"];
  /** Statute / ordinance reference */
  statuteRef: string;
}

function deriveFineTier(severity: string, confidence: number): string {
  if (severity === "high" && confidence >= 0.9) return "Tier 3 — $250–$500";
  if (severity === "high") return "Tier 2 — $150–$250";
  if (severity === "medium" && confidence >= 0.85) return "Tier 2 — $150–$250";
  if (severity === "medium") return "Tier 1 — $75–$150";
  return "Tier 1 — $75–$150";
}

function deriveRiskScore(confidence: number, severity: string, isVision: boolean): number {
  let base = confidence * 80;
  if (severity === "high") base += 15;
  else if (severity === "medium") base += 8;
  if (isVision) base += 5; // bonus for real inference
  return Math.min(Math.round(base), 100);
}

function deriveEvidenceStrength(confidence: number, objectCount: number): "strong" | "moderate" | "weak" {
  if (confidence >= 0.9 && objectCount >= 2) return "strong";
  if (confidence >= 0.75) return "moderate";
  return "weak";
}

function deriveStatuteRef(severity: string): string {
  if (severity === "high") return "MC § 8.04.080(b) — Littering from Vehicle (Aggravated)";
  if (severity === "medium") return "MC § 8.04.080(a) — Littering from Vehicle";
  return "MC § 8.04.070 — Littering in Public Right-of-Way";
}

function buildReportFields(d: Detection): ViolationReportFields {
  const isVision = isVisionDetection(d);
  const meta: VisionMeta | null = isVision ? d.__visionMeta : null;

  const litterItems: ViolationReportFields["litterItems"] = [];
  const contextObjects: ViolationReportFields["contextObjects"] = [];
  let detectedLabels: string[] = [];
  let objectCount = 0;

  if (meta) {
    objectCount = meta.allObjects.length;
    for (const obj of meta.allObjects) {
      if (obj.isLitter) {
        litterItems.push({ label: obj.litterCategory ?? obj.label, confidence: obj.confidence });
      } else {
        contextObjects.push({ label: obj.label, confidence: obj.confidence });
      }
    }
    detectedLabels = meta.labels.map((l) => l.label);
  } else {
    // Mock detection — synthesize from the Detection fields
    objectCount = 3; // simulated
    litterItems.push({ label: d.litter, confidence: d.confidence });
    detectedLabels = [d.vehicle, d.litter, "Road"];
  }

  const evidenceStrength = deriveEvidenceStrength(d.confidence, objectCount);

  let evidenceSummary: string;
  if (isVision) {
    const litterNames = litterItems.map((l) => l.label).join(", ");
    evidenceSummary =
      litterItems.length > 0
        ? `Google Cloud Vision API identified ${litterItems.length} litter item(s) (${litterNames}) with ${(d.confidence * 100).toFixed(0)}% confidence. ${contextObjects.length} context objects provide scene corroboration.`
        : `Vision analysis detected ${objectCount} objects but no definitive litter classification. Top labels: ${detectedLabels.slice(0, 4).join(", ")}. Manual review recommended.`;
  } else {
    evidenceSummary =
      `AI pipeline tracked ${d.color} ${d.vehicle} (plate ${d.plate}) and detected ejection of "${d.litter}" with ${(d.confidence * 100).toFixed(0)}% confidence. Trajectory analysis confirms object originated from vehicle occupant.`;
  }

  return {
    reportId: `RPT-${d.id.replace(/^V-|^VD-/, "")}`,
    violationType: litterItems.length > 0 ? "Littering from Vehicle" : "Unclassified Detection",
    litterCategory: d.litter,
    severity: d.severity,
    suggestedFineTier: deriveFineTier(d.severity, d.confidence),
    source: isVision ? "Google Cloud Vision API" : "LitterCam AI Pipeline",
    confidence: d.confidence,
    riskScore: deriveRiskScore(d.confidence, d.severity, isVision),
    camera: d.cameraName,
    cameraId: d.cameraId,
    gps: d.gps,
    timestamp: d.timestamp,
    plate: d.plate,
    vehicleType: d.vehicle,
    vehicleColor: d.color,
    objectCount,
    detectedLabels,
    litterItems,
    contextObjects,
    evidenceStrength,
    evidenceSummary,
    status: d.status,
    statuteRef: deriveStatuteRef(d.severity),
  };
}

// ── Formatting helpers ──────────────────────────────────────────────

function fmtTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Component ───────────────────────────────────────────────────────

interface ViolationPreviewProps {
  detection: Detection;
  /** Compact mode for review cards (fewer fields) */
  compact?: boolean;
}

/** A single row in the report preview. */
function Field({
  icon: Icon,
  label,
  children,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  highlight?: "red" | "green" | "blue" | "gold";
}) {
  const highlightClass = highlight
    ? { red: "text-brand-red", green: "text-brand-green", blue: "text-brand-blue", gold: "text-brand-gold" }[highlight]
    : "text-foreground";

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="soft-pressed-sm h-6 w-6 rounded-lg grid place-items-center shrink-0 mt-0.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold leading-tight">
          {label}
        </div>
        <div className={`text-xs font-bold leading-snug ${highlightClass}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ViolationPreview({ detection, compact = false }: ViolationPreviewProps) {
  const r = buildReportFields(detection);

  const severityTone = r.severity === "high" ? "red" : r.severity === "medium" ? "gold" : "green";
  const strengthTone = r.evidenceStrength === "strong" ? "green" : r.evidenceStrength === "moderate" ? "gold" : "red";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <SoftCard className="!p-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="soft-pressed-sm h-8 w-8 rounded-xl grid place-items-center text-brand-blue shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Violation Report Preview
              </div>
              <div className="text-sm font-bold truncate">{r.reportId}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SoftBadge tone={severityTone}>{r.severity}</SoftBadge>
            <SoftBadge tone={strengthTone}>{r.evidenceStrength}</SoftBadge>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border/50" />

        {/* Fields grid */}
        <div className={`px-5 py-3 grid gap-x-6 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
          {/* ─── Classification ─── */}
          <Field icon={AlertTriangle} label="Violation Type" highlight={r.litterItems.length > 0 ? "red" : undefined}>
            {r.violationType}
          </Field>

          <Field icon={Tag} label="Litter Category">
            {r.litterCategory}
          </Field>

          <Field icon={Scale} label="Suggested Fine Tier" highlight="gold">
            {r.suggestedFineTier}
          </Field>

          {/* ─── Confidence & scoring ─── */}
          <Field icon={Gauge} label="Model Confidence" highlight={r.confidence >= 0.9 ? "green" : r.confidence >= 0.75 ? "blue" : "gold"}>
            <div className="flex items-center gap-2">
              <span>{(r.confidence * 100).toFixed(1)}%</span>
              <div className="soft-pressed-sm h-1.5 rounded-full flex-1 max-w-20 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.confidence * 100}%`,
                    background: r.confidence >= 0.9 ? "var(--brand-green)" : r.confidence >= 0.75 ? "var(--brand-blue)" : "var(--brand-gold)",
                  }}
                />
              </div>
            </div>
          </Field>

          <Field icon={Shield} label="Risk Score">
            <div className="flex items-center gap-2">
              <span className={r.riskScore >= 80 ? "text-brand-red" : r.riskScore >= 60 ? "text-brand-gold" : "text-brand-blue"}>
                {r.riskScore}/100
              </span>
              <div className="soft-pressed-sm h-1.5 rounded-full flex-1 max-w-20 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.riskScore}%`,
                    background: r.riskScore >= 80 ? "var(--brand-red)" : r.riskScore >= 60 ? "var(--brand-gold)" : "var(--brand-blue)",
                  }}
                />
              </div>
            </div>
          </Field>

          <Field icon={Eye} label="Source">
            {r.source}
          </Field>

          {/* ─── Vehicle / plate ─── */}
          {!compact && (
            <>
              <Field icon={Hash} label="License Plate" highlight="blue">
                {r.plate === "—" || r.plate === "UPLOAD" ? "Not captured" : r.plate}
              </Field>

              <Field icon={Car} label="Vehicle">
                {r.vehicleType === "—" ? "Not identified" : `${r.vehicleColor} ${r.vehicleType}`}
              </Field>
            </>
          )}

          {/* ─── Location / time ─── */}
          <Field icon={CameraIcon} label="Camera">
            {r.camera} ({r.cameraId})
          </Field>

          {!compact && (
            <Field icon={MapPin} label="GPS Coordinates">
              {r.gps === "—" ? "Not available" : r.gps}
            </Field>
          )}

          <Field icon={Clock} label="Incident Timestamp">
            {fmtTimestamp(r.timestamp)}
          </Field>

          {!compact && (
            <Field icon={Layers} label="Statute Reference">
              {r.statuteRef}
            </Field>
          )}
        </div>

        {/* ─── Detected items ─── */}
        {!compact && (r.litterItems.length > 0 || r.contextObjects.length > 0) && (
          <>
            <div className="mx-5 h-px bg-border/50" />
            <div className="px-5 py-3">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Inference Results
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Litter items */}
                {r.litterItems.length > 0 && (
                  <div className="soft-pressed-sm rounded-xl p-3">
                    <div className="text-[9px] uppercase tracking-widest text-brand-red font-semibold mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Litter Detections ({r.litterItems.length})
                    </div>
                    <div className="flex flex-col gap-1">
                      {r.litterItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-red shrink-0" />
                            <span className="font-bold">{item.label}</span>
                          </span>
                          <span className="text-brand-green font-bold tabular-nums">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context objects */}
                {r.contextObjects.length > 0 && (
                  <div className="soft-pressed-sm rounded-xl p-3">
                    <div className="text-[9px] uppercase tracking-widest text-brand-blue font-semibold mb-1.5 flex items-center gap-1">
                      <Eye className="h-2.5 w-2.5" />
                      Context Objects ({r.contextObjects.length})
                    </div>
                    <div className="flex flex-col gap-1">
                      {r.contextObjects.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue shrink-0" />
                            <span className="font-semibold text-muted-foreground">{item.label}</span>
                          </span>
                          <span className="text-muted-foreground font-bold tabular-nums">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Label tags */}
              {r.detectedLabels.length > 0 && (
                <div className="mt-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
                    All Labels
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.detectedLabels.slice(0, 12).map((label) => (
                      <span
                        key={label}
                        className="soft-pressed-sm rounded-lg px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                    {r.detectedLabels.length > 12 && (
                      <span className="text-[10px] text-muted-foreground/60 self-center">
                        +{r.detectedLabels.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── Evidence summary ─── */}
        <div className="mx-5 h-px bg-border/50" />
        <div className="px-5 py-3">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
            <ChevronRight className="h-2.5 w-2.5" />
            Evidence Summary
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {r.evidenceSummary}
          </p>
        </div>

        {/* ─── Status footer ─── */}
        <div className="px-5 py-3 bg-black/[0.02] flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
            Review Status
          </span>
          <SoftBadge
            tone={
              r.status === "pending"
                ? "gold"
                : r.status === "approved"
                  ? "green"
                  : r.status === "false_positive"
                    ? "blue"
                    : "red"
            }
          >
            {r.status === "pending" ? "Awaiting Officer Review" : r.status}
          </SoftBadge>
        </div>
      </SoftCard>
    </motion.div>
  );
}
