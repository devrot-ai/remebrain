/**
 * Per-camera inference history list.
 *
 * Shows the last N analyzed frames with confidence, detected labels,
 * violation fields, and timestamps. Styled with Soft UI neumorphism.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { SoftBadge } from "@/components/soft/SoftBadge";
import type { InferenceSnapshot } from "@/lib/mock/useLiveDetections";

interface CameraInferenceHistoryProps {
  /** Camera name for the header */
  cameraName: string;
  /** The inference history snapshots (newest first) */
  history: InferenceSnapshot[];
  /** Max items to display at once (default 10) */
  maxVisible?: number;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtTimeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function CameraInferenceHistory({
  cameraName,
  history,
  maxVisible = 10,
}: CameraInferenceHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleHistory = showAll ? history : history.slice(0, maxVisible);
  const litterCount = history.filter((s) => s.litterDetected).length;
  const avgConf =
    history.length > 0
      ? history.reduce((sum, s) => sum + s.confidence, 0) / history.length
      : 0;

  return (
    <div className="mt-4">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full soft-raised-sm soft-press rounded-2xl px-4 py-2.5 flex items-center justify-between text-left transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="soft-pressed-sm h-7 w-7 rounded-xl grid place-items-center text-brand-blue shrink-0">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">
              Inference History
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {history.length} frames · avg{" "}
              {(avgConf * 100).toFixed(0)}% conf
              {litterCount > 0 && (
                <span className="text-brand-red ml-1">
                  · {litterCount} violation{litterCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* History list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="soft-pressed rounded-2xl mt-2 p-3 max-h-[360px] overflow-y-auto">
              {/* Column headers */}
              <div className="grid grid-cols-[40px_1fr_auto] gap-2 px-2 pb-2 mb-1 border-b border-border/40">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                  #
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Detections
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold text-right">
                  Conf
                </span>
              </div>

              {visibleHistory.map((snap, i) => (
                <motion.div
                  key={snap.id}
                  initial={i === 0 ? { opacity: 0, x: -8 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`grid grid-cols-[40px_1fr_auto] gap-2 px-2 py-2 rounded-xl text-xs items-start ${
                    snap.litterDetected
                      ? "bg-brand-red/[0.06]"
                      : i % 2 === 0
                        ? "bg-transparent"
                        : "bg-black/[0.02]"
                  }`}
                >
                  {/* Frame number + time */}
                  <div className="flex flex-col items-start">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      F{snap.frameNumber}
                    </span>
                  </div>

                  {/* Detection details */}
                  <div className="min-w-0 flex flex-col gap-1">
                    {/* Labels row */}
                    <div className="flex flex-wrap gap-1">
                      {snap.detectedLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-0.5 text-[10px]"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{
                              background:
                                label === "Trash"
                                  ? "#e15a5a"
                                  : label === "Pedestrian"
                                    ? "#f0a742"
                                    : label === "Motorcycle"
                                      ? "#7d5cff"
                                      : label === "Plate"
                                        ? "#5ec48a"
                                        : "#4a86ff",
                            }}
                          />
                          <span className="font-semibold">{label}</span>
                        </span>
                      ))}
                    </div>

                    {/* Violation row */}
                    {snap.litterDetected && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3 text-brand-red shrink-0" />
                        <span className="font-bold text-brand-red">
                          {snap.litterLabel ?? "Litter detected"}
                        </span>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {fmtTime(snap.timestamp)}
                      </span>
                      <span className="opacity-60">
                        {fmtTimeAgo(snap.timestamp)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-2.5 w-2.5" />
                        {snap.objectCount} obj
                      </span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="text-right flex flex-col items-end gap-1">
                    <span
                      className={`font-bold text-xs tabular-nums ${
                        snap.confidence >= 0.9
                          ? "text-brand-green"
                          : snap.confidence >= 0.8
                            ? "text-brand-blue"
                            : "text-brand-gold"
                      }`}
                    >
                      {(snap.confidence * 100).toFixed(0)}%
                    </span>
                    {snap.litterDetected && (
                      <SoftBadge tone="red">
                        <span className="text-[8px]">VIOLATION</span>
                      </SoftBadge>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Show more / less */}
              {history.length > maxVisible && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAll((v) => !v);
                  }}
                  className="w-full mt-2 text-center text-[10px] font-bold text-brand-blue py-1.5 soft-raised-sm rounded-xl soft-press"
                >
                  {showAll
                    ? "Show less"
                    : `Show all ${history.length} frames`}
                </button>
              )}

              {history.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-4 italic">
                  No inference history yet — waiting for frames…
                </div>
              )}
            </div>

            {/* Summary stats bar */}
            {history.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="soft-pressed-sm rounded-xl py-1.5 text-center">
                  <div className="text-[9px] uppercase text-muted-foreground">
                    Frames
                  </div>
                  <div className="font-bold text-xs tabular-nums">
                    {history.length}
                  </div>
                </div>
                <div className="soft-pressed-sm rounded-xl py-1.5 text-center">
                  <div className="text-[9px] uppercase text-muted-foreground">
                    Avg Conf
                  </div>
                  <div className="font-bold text-xs text-brand-green tabular-nums">
                    {(avgConf * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="soft-pressed-sm rounded-xl py-1.5 text-center">
                  <div className="text-[9px] uppercase text-muted-foreground">
                    Violations
                  </div>
                  <div
                    className={`font-bold text-xs tabular-nums ${
                      litterCount > 0 ? "text-brand-red" : "text-foreground"
                    }`}
                  >
                    {litterCount}
                  </div>
                </div>
                <div className="soft-pressed-sm rounded-xl py-1.5 text-center">
                  <div className="text-[9px] uppercase text-muted-foreground">
                    Rate
                  </div>
                  <div className="font-bold text-xs text-brand-blue tabular-nums">
                    {history.length > 0
                      ? `${((litterCount / history.length) * 100).toFixed(0)}%`
                      : "—"}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
