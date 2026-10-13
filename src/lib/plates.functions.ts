import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPlateExamples = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("plate_examples")
      .select("id, ai_plate, correct_plate, violation_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addPlateExample = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        ai_plate: z.string().trim().max(20).optional().nullable(),
        correct_plate: z.string().trim().min(1).max(20),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("plate_examples").insert({
      owner_id: context.userId,
      ai_plate: data.ai_plate?.toUpperCase() || null,
      correct_plate: data.correct_plate.toUpperCase(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlateExample = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("plate_examples").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
