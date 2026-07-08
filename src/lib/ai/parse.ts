import type { LitterAnalysis } from "./types";

/**
 * Parse a raw model response into a LitterAnalysis. Tolerates fenced code
 * blocks and surrounding prose. Throws if no valid JSON with the required
 * fields is found.
 */
export function parseLitterAnalysis(text: string): LitterAnalysis {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let jsonStr = cleaned;
  if (!jsonStr.startsWith("{")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model did not return JSON");
    }
    jsonStr = cleaned.slice(start, end + 1);
  }

  const parsed = JSON.parse(jsonStr) as Partial<LitterAnalysis>;

  return {
    litter_detected: Boolean(parsed.litter_detected),
    confidence: clamp01(Number(parsed.confidence ?? 0)),
    litter_type: String(parsed.litter_type ?? "unknown"),
    vehicle: String(parsed.vehicle ?? "unknown"),
    vehicle_color: String(parsed.vehicle_color ?? "unknown"),
    plate_guess: String(parsed.plate_guess ?? ""),
    severity:
      parsed.severity === "high" || parsed.severity === "medium" || parsed.severity === "low"
        ? parsed.severity
        : "low",
    reasoning: String(parsed.reasoning ?? "").slice(0, 400),
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n > 1) return n > 100 ? 1 : n / 100;
  if (n < 0) return 0;
  return n;
}
