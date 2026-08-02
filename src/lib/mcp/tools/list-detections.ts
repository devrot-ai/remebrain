import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_detections",
  title: "List detections",
  description:
    "List recent AI litter detections for the signed-in officer, newest first. Optionally only positive detections or a single camera.",
  inputSchema: {
    camera_id: z.string().optional().describe("Filter to one camera UUID."),
    only_positive: z.boolean().optional().describe("Only rows where litter was detected."),
    limit: z.number().int().optional().describe("Max rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ camera_id, only_positive, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("detections")
      .select(
        "id, camera_id, litter_detected, litter_type, confidence, severity, vehicle, vehicle_color, plate_guess, reasoning, provider, model, latency_ms, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));

    if (camera_id) query = query.eq("camera_id", camera_id);
    if (only_positive) query = query.eq("litter_detected", true);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { detections: data ?? [] },
    };
  },
});
