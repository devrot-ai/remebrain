import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listViolations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        filter: z.enum(["pending", "reviewed"]).optional(),
        plate: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        page: z.number().int().optional(),
        pageSize: z.number().int().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const pageSize = Math.min(Math.max(data.pageSize ?? 25, 1), 100);
    const page = Math.max(data.page ?? 1, 1);
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = context.supabase
      .from("violations")
      .select("*, detections(*), cameras(name, location)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(fromIdx, toIdx);

    const filter = data.filter;
    if (filter === "pending") {
      query = query.eq("status", "pending");
    } else if (filter === "reviewed") {
      query = query.in("status", ["confirmed", "dismissed"]);
    }

    if (data.plate && data.plate.trim()) {
      query = query.ilike("plate_guess", `%${data.plate.trim()}%`);
    }
    if (data.from) query = query.gte("created_at", data.from);
    if (data.to) query = query.lte("created_at", data.to);

    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
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
      .update(patch as never)
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
