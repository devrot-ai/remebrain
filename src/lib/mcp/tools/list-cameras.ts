import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_cameras",
  title: "List cameras",
  description: "List the signed-in officer's LitterCam cameras with status and thresholds.",
  inputSchema: {
    limit: z.number().int().optional().describe("Max cameras to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("cameras")
      .select("id, name, location, active, confidence_threshold, capture_interval_sec, created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { cameras: data ?? [] },
    };
  },
});
