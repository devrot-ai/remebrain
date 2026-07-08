/**
 * React hook for uploading images and analyzing them via Google Cloud Vision API.
 */

import { useState, useCallback } from "react";
import { annotateImage, fileToBase64, fileToDataUri } from "@/lib/vision/client";
import { parseVisionResponse, visionToDetections } from "@/lib/vision/parser";
import type { Detection } from "@/lib/mock/data";
import type { VisionAnnotation } from "@/lib/vision/types";

export interface UseVisionDetectionsReturn {
  /** All detections produced by Vision API uploads (newest first). */
  visionDetections: Detection[];
  /** The most recent raw annotation result. */
  lastAnnotation: VisionAnnotation | null;
  /** Whether an image is currently being analyzed. */
  isAnalyzing: boolean;
  /** Last error message, if any. */
  error: string | null;
  /** Upload a file and run Vision API inference. */
  uploadAndAnalyze: (file: File) => Promise<void>;
  /** Clear all vision detections. */
  clearDetections: () => void;
}

export function useVisionDetections(): UseVisionDetectionsReturn {
  const [visionDetections, setVisionDetections] = useState<Detection[]>([]);
  const [lastAnnotation, setLastAnnotation] = useState<VisionAnnotation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAndAnalyze = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert file to base64 for the API and data-URI for rendering
      const [base64, dataUri] = await Promise.all([
        fileToBase64(file),
        fileToDataUri(file),
      ]);

      // Call the Vision API
      const apiResponse = await annotateImage(base64);

      // Parse the first (only) response
      const annotateResponse = apiResponse.responses[0];
      if (!annotateResponse) {
        throw new Error("Empty response from Vision API");
      }

      const annotation = parseVisionResponse(annotateResponse, dataUri);
      setLastAnnotation(annotation);

      // Convert to Detection[] and prepend to existing detections
      const newDetections = visionToDetections(annotation, "Image Upload");
      setVisionDetections((prev) => [...newDetections, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error during analysis";
      setError(message);
      console.error("Vision API analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearDetections = useCallback(() => {
    setVisionDetections([]);
    setLastAnnotation(null);
    setError(null);
  }, []);

  return {
    visionDetections,
    lastAnnotation,
    isAnalyzing,
    error,
    uploadAndAnalyze,
    clearDetections,
  };
}
