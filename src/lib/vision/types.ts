/**
 * Types for the Google Cloud Vision API integration.
 *
 * Raw API response shapes + our parsed intermediary types.
 */

// ── Raw Vision API response shapes ──────────────────────────────────

/** A single vertex in a bounding polygon (normalized 0..1). */
export interface VisionVertex {
  x: number;
  y: number;
}

/** Bounding polygon returned by OBJECT_LOCALIZATION. */
export interface VisionBoundingPoly {
  normalizedVertices: VisionVertex[];
}

/** A single localized object from the Vision API. */
export interface VisionLocalizedObject {
  mid: string;
  name: string;
  score: number;
  boundingPoly: VisionBoundingPoly;
}

/** A single label annotation from the Vision API. */
export interface VisionLabelAnnotation {
  mid: string;
  description: string;
  score: number;
  topicality: number;
}

/** Shape of a single `annotateResponse` entry. */
export interface VisionAnnotateResponse {
  localizedObjectAnnotations?: VisionLocalizedObject[];
  labelAnnotations?: VisionLabelAnnotation[];
  error?: { code: number; message: string };
}

/** Top-level API response wrapper. */
export interface VisionApiResponse {
  responses: VisionAnnotateResponse[];
}

// ── Parsed types consumed by the UI ─────────────────────────────────

/** A detected object with a bounding box (in percent 0-100). */
export interface DetectedObject {
  /** Unique per-detection id */
  id: string;
  /** Human-readable label (e.g. "Bottle", "Person") */
  label: string;
  /** Confidence 0..1 */
  confidence: number;
  /** Bounding box in percent of image dimensions */
  box: { x: number; y: number; w: number; h: number };
  /** Whether this object maps to a litter category */
  isLitter: boolean;
  /** Mapped litter category name, if isLitter */
  litterCategory?: string;
}

/** Full parsed result of a single image annotation. */
export interface VisionAnnotation {
  objects: DetectedObject[];
  labels: Array<{ label: string; confidence: number }>;
  /** Base64 data-URI of the uploaded image (for rendering) */
  imageDataUri: string;
  /** Timestamp of the analysis */
  timestamp: string;
}
