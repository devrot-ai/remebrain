import { useEffect, useState, useRef } from "react";

export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  trackId: number;
  isLitter?: boolean;
}

/** A single inference snapshot recorded from one "frame". */
export interface InferenceSnapshot {
  /** Unique id for this snapshot */
  id: string;
  /** ISO timestamp of when inference ran */
  timestamp: string;
  /** All detected boxes in this frame */
  boxes: Box[];
  /** Aggregate confidence across all detections (avg) */
  confidence: number;
  /** Number of objects detected */
  objectCount: number;
  /** Whether litter was detected in this frame */
  litterDetected: boolean;
  /** Litter label, if detected */
  litterLabel?: string;
  /** Detected object labels for summary */
  detectedLabels: string[];
  /** Frame number since camera started */
  frameNumber: number;
}

const labels = [
  { label: "Car", color: "#4a86ff", w: 34, h: 22 },
  { label: "SUV", color: "#4a86ff", w: 40, h: 26 },
  { label: "Bus", color: "#4a86ff", w: 46, h: 30 },
  { label: "Motorcycle", color: "#7d5cff", w: 18, h: 22 },
  { label: "Pedestrian", color: "#f0a742", w: 10, h: 24 },
  { label: "Plate", color: "#5ec48a", w: 14, h: 6 },
];

const litterLabels = [
  "Plastic bottle",
  "Cigarette",
  "Paper cup",
  "Fast food bag",
  "Aluminum can",
  "Napkin",
];

/** Maximum number of inference snapshots to keep per camera. */
const MAX_HISTORY = 25;

export function useLiveDetections(
  seed = 1,
  litterChance = 0.06,
) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [litter, setLitter] = useState(false);
  const [history, setHistory] = useState<InferenceSnapshot[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    let id = seed * 100;
    let track = seed * 10;

    const tick = () => {
      frameRef.current++;
      const count = 2 + Math.floor(Math.random() * 3);
      const next: Box[] = Array.from({ length: count }).map(() => {
        const spec = labels[Math.floor(Math.random() * labels.length)];
        return {
          id: `b-${id++}`,
          x: 8 + Math.random() * 60,
          y: 30 + Math.random() * 45,
          w: spec.w,
          h: spec.h,
          label: spec.label,
          color: spec.color,
          trackId: track++ % 999,
        };
      });

      const throwing = Math.random() < litterChance;
      let litterLabel: string | undefined;
      if (throwing) {
        litterLabel =
          litterLabels[Math.floor(Math.random() * litterLabels.length)];
        next.push({
          id: `l-${id++}`,
          x: 40 + Math.random() * 30,
          y: 20 + Math.random() * 30,
          w: 6,
          h: 6,
          label: "Trash",
          color: "#e15a5a",
          trackId: track++,
          isLitter: true,
        });
        setLitter(true);
        setTimeout(() => setLitter(false), 1400);
      }
      setBoxes(next);

      // Build confidence values per-box (simulated, 0.72–0.99)
      const confidences = next.map(
        () => 0.72 + Math.random() * 0.27,
      );
      const avgConf =
        confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0;

      const snapshot: InferenceSnapshot = {
        id: `snap-${seed}-${frameRef.current}`,
        timestamp: new Date().toISOString(),
        boxes: next,
        confidence: avgConf,
        objectCount: next.length,
        litterDetected: throwing,
        litterLabel,
        detectedLabels: [...new Set(next.map((b) => b.label))],
        frameNumber: frameRef.current,
      };

      setHistory((prev) => [snapshot, ...prev].slice(0, MAX_HISTORY));
    };

    tick();
    const int = setInterval(tick, 1600 + seed * 120);
    return () => clearInterval(int);
  }, [seed, litterChance]);

  return { boxes, litter, history };
}
