import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "review_violation",
  title: "Review violation",
  description:
    "Record an officer decision on a violation: approve (confirmed) or reject (dismissed). Stamps the reviewing officer and timestamp.",
  inputSchema: {
    id: z.string().describe("Violation UUID."),
    decision: z.enum(["approve", "reject"]).describe("Officer decision."),
    notes: z.string().optional().describe("Optional review notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ id, decision, notes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: existing, error: readError } = await supabase
      .from("violations")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();
    if (readError) return { content: [{ type: "text", text: readError.message }], isError: true };
    if (!existing) {
      return { content: [{ type: "text", text: `No violation found for id ${id}` }], isError: true };
    }
    if (existing.status !== "pending") {
      return {
        content: [
          { type: "text", text: `Violation ${id} was already reviewed (${existing.status}).` },
        ],
        isError: true,
      };
    }

    const { data, error } = await supabase
      .from("violations")
      .update({
        status: decision === "approve" ? "confirmed" : "dismissed",
        notes: notes ?? null,
        reviewed_by: ctx.getUserId(),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { violation: data },
    };
  },
});
