/**
 * ReviewDecisionsContext — shared store for officer review decisions.
 *
 * Stores every approve / reject / false-positive action with the
 * officer name and an ISO timestamp.  The decision map is keyed by
 * detection ID and exposed app-wide so every page sees the same
 * status updates.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Detection } from "@/lib/mock/data";

// ── Types ──────────────────────────────────────────────────────────

export type ReviewAction = "approved" | "rejected" | "false_positive";

export interface ReviewDecision {
  /** The detection this decision applies to. */
  detectionId: string;
  /** Officer action. */
  action: ReviewAction;
  /** ISO timestamp of when the decision was made. */
  timestamp: string;
  /** Name / badge of the reviewing officer. */
  officerName: string;
  /** Optional free-text notes from the officer. */
  notes?: string;
}

export interface ReviewDecisionsContextValue {
  /** Map of detectionId → decision. */
  decisions: ReadonlyMap<string, ReviewDecision>;

  /** Record a decision for a single detection. */
  decide: (
    detectionId: string,
    action: ReviewAction,
    notes?: string,
  ) => void;

  /** Record the same decision for multiple detections at once. */
  decideBatch: (
    detectionIds: string[],
    action: ReviewAction,
  ) => void;

  /** Look up the decision for a detection (if any). */
  getDecision: (detectionId: string) => ReviewDecision | undefined;

  /**
   * Apply stored decisions to a Detection array, returning copies
   * with `status` updated to match the officer's action.
   */
  applyDecisions: (detections: Detection[]) => Detection[];

  /** All decisions as an array, newest first. */
  decisionLog: ReviewDecision[];
}

// ── Context ────────────────────────────────────────────────────────

const ReviewDecisionsContext =
  createContext<ReviewDecisionsContextValue | null>(null);

/** Default officer name used when no auth context is available. */
const OFFICER_NAME = "Officer Mora";

export function ReviewDecisionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [decisions, setDecisions] = useState<Map<string, ReviewDecision>>(
    () => new Map(),
  );

  // ── Single decision ────────────────────────────────────────────

  const decide = useCallback(
    (detectionId: string, action: ReviewAction, notes?: string) => {
      setDecisions((prev) => {
        const next = new Map(prev);
        next.set(detectionId, {
          detectionId,
          action,
          timestamp: new Date().toISOString(),
          officerName: OFFICER_NAME,
          notes,
        });
        return next;
      });
    },
    [],
  );

  // ── Batch decisions ────────────────────────────────────────────

  const decideBatch = useCallback(
    (detectionIds: string[], action: ReviewAction) => {
      setDecisions((prev) => {
        const next = new Map(prev);
        const now = new Date().toISOString();
        for (const id of detectionIds) {
          next.set(id, {
            detectionId: id,
            action,
            timestamp: now,
            officerName: OFFICER_NAME,
          });
        }
        return next;
      });
    },
    [],
  );

  // ── Lookup helper ──────────────────────────────────────────────

  const getDecision = useCallback(
    (detectionId: string) => decisions.get(detectionId),
    [decisions],
  );

  // ── Apply decisions to Detection[] ─────────────────────────────

  const applyDecisions = useCallback(
    (detections: Detection[]): Detection[] =>
      detections.map((d) => {
        const dec = decisions.get(d.id);
        if (!dec) return d;
        return { ...d, status: dec.action };
      }),
    [decisions],
  );

  // ── All decisions as a sorted array ────────────────────────────

  const decisionLog = useMemo<ReviewDecision[]>(
    () =>
      Array.from(decisions.values()).sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [decisions],
  );

  // ── Context value ──────────────────────────────────────────────

  const value = useMemo<ReviewDecisionsContextValue>(
    () => ({
      decisions,
      decide,
      decideBatch,
      getDecision,
      applyDecisions,
      decisionLog,
    }),
    [decisions, decide, decideBatch, getDecision, applyDecisions, decisionLog],
  );

  return (
    <ReviewDecisionsContext.Provider value={value}>
      {children}
    </ReviewDecisionsContext.Provider>
  );
}

/**
 * Access the shared review-decisions context.
 *
 * Must be called inside `ReviewDecisionsProvider`.
 */
export function useReviewDecisions(): ReviewDecisionsContextValue {
  const ctx = useContext(ReviewDecisionsContext);
  if (!ctx) {
    throw new Error(
      "useReviewDecisions must be used within ReviewDecisionsProvider",
    );
  }
  return ctx;
}
