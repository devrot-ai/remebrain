import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_violations",
  title: "List violations",
  description:
    "List littering violations for the signed-in officer. Optionally filter by review status, license plate text, and creation date range.",
  inputSchema: {
    status: z
      .enum(["pending", "confirmed", "dismissed"])
      .optional()
      .describe("Review status filter."),
    plate: z.string().optional().describe("Partial license plate text to match."),
    from: z.string().optional().describe("ISO timestamp lower bound on created_at."),
    to: z.string().optional().describe("ISO timestamp upper bound on created_at."),
    limit: z.number().int().optional().describe("Max rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, plate, from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("violations")
      .select(
        "id, status, severity, plate_guess, notes, reviewed_by, reviewed_at, created_at, cameras(name, location), detections(litter_type, vehicle, vehicle_color, confidence)",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 25, 1), 100));

    if (status) query = query.eq("status", status);
    if (plate?.trim()) query = query.ilike("plate_guess", `%${plate.trim()}%`);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { violations: data ?? [] },
    };
  },
});
