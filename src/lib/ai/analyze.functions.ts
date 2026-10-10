import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LITTER_SYSTEM_PROMPT, LITTER_USER_PROMPT } from "./prompt";


const InputSchema = z.object({
  imageDataUrl: z.string().min(32).max(20_000_000),
  model: z.string().min(1).max(120).optional(),
});

/**
 * Runs a single-frame litter-detection inference through the Lovable AI
 * Gateway. Returns the raw model text so the client can parse and normalize.
 */
export const analyzeFrameLovable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: examples } = await context.supabase
      .from("plate_examples")
      .select("ai_plate, correct_plate")
      .order("created_at", { ascending: false })
      .limit(20);
    const exampleText = (examples ?? []).length
      ? "\n\nPlate corrections made by human officers on this camera network (AI read -> correct). Learn from these patterns and the local plate format:\n" +
        (examples ?? []).map((e) => `- ${e.ai_plate || "(none)"} -> ${e.correct_plate}`).join("\n")
      : "";
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured on the server.");
    }

    const model = data.model ?? "google/gemini-2.5-flash";
    const started = Date.now();


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: LITTER_SYSTEM_PROMPT + exampleText },
          {
            role: "user",
            content: [
              { type: "text", text: LITTER_USER_PROMPT },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (response.status === 429) {
        throw new Error("Rate limit reached on Lovable AI. Please wait and retry.");
      }
      if (response.status === 402) {
        throw new Error("Lovable AI credits exhausted. Add credits in workspace billing.");
      }
      throw new Error(
        `Lovable AI Gateway ${response.status}: ${body.slice(0, 300) || response.statusText}`,
      );
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";

    return {
      model,
      latencyMs: Date.now() - started,
      raw: text,
    };
  });
