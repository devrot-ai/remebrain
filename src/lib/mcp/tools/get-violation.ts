import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_violation",
  title: "Get violation",
  description: "Fetch one violation with its detection evidence and camera details by ID.",
  inputSchema: { id: z.string().describe("Violation UUID.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("violations")
      .select("*, detections(*), cameras(name, location, lat, lng)")
      .eq("id", id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return { content: [{ type: "text", text: `No violation found for id ${id}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { violation: data },
    };
  },
});
