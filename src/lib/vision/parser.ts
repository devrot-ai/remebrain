/**
 * Parse Vision API responses into UI-consumable types.
 */

import type {
  VisionAnnotateResponse,
  VisionAnnotation,
  DetectedObject,
  VisionLocalizedObject,
} from "./types";
import type { Detection } from "@/lib/mock/data";

// ── Litter category mapping ────────────────────────────────────────

/** Map Vision API object/label names → litter categories (case-insensitive). */
const LITTER_MAP: Record<string, string> = {
  bottle: "Plastic bottle",
  "plastic bottle": "Plastic bottle",
  "water bottle": "Plastic bottle",
  cup: "Paper cup",
  "paper cup": "Paper cup",
  "coffee cup": "Paper cup",
  "disposable cup": "Paper cup",
  can: "Aluminum can",
  "aluminum can": "Aluminum can",
  "tin can": "Aluminum can",
  "drink can": "Aluminum can",
  bag: "Fast food bag",
  "plastic bag": "Fast food bag",
  "paper bag": "Fast food bag",
  "fast food": "Fast food bag",
  wrapper: "Fast food bag",
  napkin: "Napkin",
  tissue: "Napkin",
  "paper towel": "Napkin",
  cigarette: "Cigarette",
  "cigarette butt": "Cigarette",
  trash: "Trash",
  waste: "Trash",
  litter: "Trash",
  packaging: "Fast food bag",
  straw: "Plastic bottle",
  carton: "Paper cup",
  box: "Fast food bag",
  "food container": "Fast food bag",
};

function classifyAsLitter(
  name: string,
): { isLitter: true; category: string } | { isLitter: false } {
  const lower = name.toLowerCase().trim();
  // Direct match
  if (LITTER_MAP[lower]) {
    return { isLitter: true, category: LITTER_MAP[lower] };
  }
  // Partial match
  for (const [key, category] of Object.entries(LITTER_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { isLitter: true, category };
    }
  }
  return { isLitter: false };
}

// ── Bounding-box helpers ───────────────────────────────────────────

function objectToBox(obj: VisionLocalizedObject): DetectedObject["box"] {
  const verts = obj.boundingPoly.normalizedVertices;
  if (!verts || verts.length < 2) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  const xs = verts.map((v) => (v.x ?? 0) * 100);
  const ys = verts.map((v) => (v.y ?? 0) * 100);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ── Main parser ────────────────────────────────────────────────────

let _idCounter = 0;
function nextId() {
  return `vision-${++_idCounter}`;
}

/**
 * Parse a single `annotateResponse` into our `VisionAnnotation` shape.
 */
export function parseVisionResponse(
  response: VisionAnnotateResponse,
  imageDataUri: string,
): VisionAnnotation {
  if (response.error) {
    throw new Error(
      `Vision API error (${response.error.code}): ${response.error.message}`,
    );
  }

  const objects: DetectedObject[] = (
    response.localizedObjectAnnotations ?? []
  ).map((obj) => {
    const litter = classifyAsLitter(obj.name);
    return {
      id: nextId(),
      label: obj.name,
      confidence: obj.score,
      box: objectToBox(obj),
      isLitter: litter.isLitter,
      litterCategory: litter.isLitter ? litter.category : undefined,
    };
  });

  const labels = (response.labelAnnotations ?? []).map((l) => ({
    label: l.description,
    confidence: l.score,
  }));

  return {
    objects,
    labels,
    imageDataUri,
    timestamp: new Date().toISOString(),
  };
}

// ── Convert VisionAnnotation → Detection[] for the UI ──────────────

const vehicles = ["Sedan", "SUV", "Pickup", "Van", "Motorcycle", "Bus"];
const colors = ["White", "Black", "Silver", "Blue", "Red", "Gray"];

function pseudoRandom(seed: number): number {
  const s = ((seed * 9301 + 49297) % 233280) / 233280;
  return s;
}

/**
 * Convert a `VisionAnnotation` into `Detection[]` entries compatible with
 * the existing mock data shape so pages can render them directly.
 *
 * Each litter-classified object becomes its own Detection.
 * Non-litter objects are grouped into a single "general detection" entry.
 */
export function visionToDetections(
  annotation: VisionAnnotation,
  cameraName = "Upload",
): Detection[] {
  const results: Detection[] = [];
  let seq = 0;

  // Create a detection for each detected object
  for (const obj of annotation.objects) {
    seq++;
    const seed = obj.label.charCodeAt(0) + seq;
    const r = pseudoRandom(seed);

    const detection: Detection = {
      id: `VD-${Date.now()}-${seq}`,
      cameraId: "UPLOAD",
      cameraName,
      plate: obj.isLitter ? "UPLOAD" : "—",
      vehicle: vehicles[Math.floor(r * vehicles.length)],
      color: colors[Math.floor(pseudoRandom(seed + 1) * colors.length)],
      timestamp: annotation.timestamp,
      gps: "—",
      confidence: obj.confidence,
      litter: obj.isLitter
        ? (obj.litterCategory ?? obj.label)
        : obj.label,
      status: "pending",
      severity:
        obj.confidence > 0.85
          ? "high"
          : obj.confidence > 0.6
            ? "medium"
            : "low",
    };

    // Attach vision-specific extras for rendering
    (detection as VisionDetection).__visionMeta = {
      imageDataUri: annotation.imageDataUri,
      box: obj.box,
      isLitter: obj.isLitter,
      allObjects: annotation.objects,
      labels: annotation.labels,
    };

    results.push(detection);
  }

  // If no localized objects but we have labels, create one summary detection
  if (annotation.objects.length === 0 && annotation.labels.length > 0) {
    const topLabel = annotation.labels[0];
    const litter = classifyAsLitter(topLabel.label);
    seq++;

    const detection: Detection = {
      id: `VD-${Date.now()}-${seq}`,
      cameraId: "UPLOAD",
      cameraName,
      plate: "UPLOAD",
      vehicle: "—",
      color: "—",
      timestamp: annotation.timestamp,
      gps: "—",
      confidence: topLabel.confidence,
      litter: litter.isLitter ? litter.category : topLabel.label,
      status: "pending",
      severity: topLabel.confidence > 0.85 ? "high" : "medium",
    };

    (detection as VisionDetection).__visionMeta = {
      imageDataUri: annotation.imageDataUri,
      box: null,
      isLitter: litter.isLitter,
      allObjects: [],
      labels: annotation.labels,
    };

    results.push(detection);
  }

  return results;
}

// ── Extended Detection type with vision metadata ───────────────────

export interface VisionMeta {
  imageDataUri: string;
  box: DetectedObject["box"] | null;
  isLitter: boolean;
  allObjects: DetectedObject[];
  labels: Array<{ label: string; confidence: number }>;
}

export interface VisionDetection extends Detection {
  __visionMeta: VisionMeta;
}

export function isVisionDetection(d: Detection): d is VisionDetection {
  return "__visionMeta" in d;
}
