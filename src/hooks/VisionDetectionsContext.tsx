/**
 * React Context that shares Vision detection state across all pages.
 *
 * Also provides a merged `allDetections` array that combines Vision
 * results (newest first) with the mock data fallback.
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import {
  useVisionDetections,
  type UseVisionDetectionsReturn,
} from "./useVisionDetections";
import { detections as mockDetections } from "@/lib/mock/data";
import type { Detection } from "@/lib/mock/data";
import { isVisionConfigured } from "@/lib/vision/client";

interface VisionDetectionsContextValue extends UseVisionDetectionsReturn {
  /** Vision detections + mock detections combined (vision first). */
  allDetections: Detection[];
  /** Whether the Vision API key is configured. */
  isConfigured: boolean;
}

const VisionDetectionsContext =
  createContext<VisionDetectionsContextValue | null>(null);

export function VisionDetectionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const vision = useVisionDetections();

  const isConfigured = useMemo(() => isVisionConfigured(), []);

  const allDetections = useMemo(
    () => [...vision.visionDetections, ...mockDetections],
    [vision.visionDetections],
  );

  const value = useMemo<VisionDetectionsContextValue>(
    () => ({
      ...vision,
      allDetections,
      isConfigured,
    }),
    [vision, allDetections, isConfigured],
  );

  return (
    <VisionDetectionsContext.Provider value={value}>
      {children}
    </VisionDetectionsContext.Provider>
  );
}

/**
 * Access the shared Vision detection context.
 *
 * Must be called inside `VisionDetectionsProvider`.
 */
export function useVisionDetectionsContext(): VisionDetectionsContextValue {
  const ctx = useContext(VisionDetectionsContext);
  if (!ctx) {
    throw new Error(
      "useVisionDetectionsContext must be used within VisionDetectionsProvider",
    );
  }
  return ctx;
}
