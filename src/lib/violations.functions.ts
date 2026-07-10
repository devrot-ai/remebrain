import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listViolations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("violations")
      .select("*, detections(*), cameras(name, location)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getViolation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("violations")
      .select("*, detections(*), cameras(name, location)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Violation not found");
    return row;
  });

export const updateViolationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "dismissed"]),
        notes: z.string().max(2000).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const isReview = data.status === "confirmed" || data.status === "dismissed";
    const patch: Record<string, unknown> = {
      status: data.status,
      notes: data.notes ?? null,
      reviewed_by: isReview ? context.userId : null,
      reviewed_at: isReview ? new Date().toISOString() : null,
    };
    const { data: row, error } = await context.supabase
      .from("violations")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = today.toISOString();

    const [{ count: camerasCount }, { count: camerasOnline }, { count: todayViolations }, { count: pending }, { count: totalDetections }] =
      await Promise.all([
        supabase.from("cameras").select("id", { count: "exact", head: true }).eq("owner_id", userId),
        supabase
          .from("cameras")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId)
          .eq("active", true),
        supabase
          .from("violations")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId)
          .gte("created_at", iso),
        supabase
          .from("violations")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId)
          .eq("status", "pending"),
        supabase.from("detections").select("id", { count: "exact", head: true }).eq("owner_id", userId),
      ]);

    return {
      cameras: camerasCount ?? 0,
      camerasOnline: camerasOnline ?? 0,
      todayViolations: todayViolations ?? 0,
      pending: pending ?? 0,
      totalDetections: totalDetections ?? 0,
    };
  });
