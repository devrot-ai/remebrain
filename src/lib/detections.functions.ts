import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnalysisSchema = z.object({
  litter_detected: z.boolean(),
  confidence: z.number().min(0).max(1),
  litter_type: z.string().default(""),
  vehicle: z.string().default(""),
  vehicle_color: z.string().default(""),
  plate_guess: z.string().default(""),
  severity: z.enum(["low", "medium", "high"]).default("low"),
  reasoning: z.string().default(""),
});

const RecordSchema = z.object({
  camera_id: z.string().uuid().nullable().optional(),
  storage_path: z.string().nullable().optional(),
  captured_at: z.string().datetime().optional(),
  provider: z.enum(["lovable", "ollama"]),
  model: z.string(),
  latency_ms: z.number().int().nonnegative(),
  raw: z.string().optional().nullable(),
  analysis: AnalysisSchema,
});

export const recordCapture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RecordSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let frameId: string | null = null;

    if (data.storage_path) {
      const { data: frame, error: frameErr } = await supabase
        .from("frames")
        .insert({
          owner_id: userId,
          camera_id: data.camera_id ?? null,
          storage_path: data.storage_path,
          captured_at: data.captured_at ?? new Date().toISOString(),
        })
        .select("id")
        .single();
      if (frameErr) throw new Error(frameErr.message);
      frameId = frame.id;
    }

    const a = data.analysis;
    const { data: detection, error: detErr } = await supabase
      .from("detections")
      .insert({
        owner_id: userId,
        frame_id: frameId,
        camera_id: data.camera_id ?? null,
        provider: data.provider,
        model: data.model,
        latency_ms: data.latency_ms,
        litter_detected: a.litter_detected,
        confidence: a.confidence,
        litter_type: a.litter_type || null,
        vehicle: a.vehicle || null,
        vehicle_color: a.vehicle_color || null,
        plate_guess: a.plate_guess || null,
        severity: a.severity,
        reasoning: a.reasoning || null,
        raw: data.raw ?? null,
      })
      .select()
      .single();
    if (detErr) throw new Error(detErr.message);

    let violationId: string | null = null;
    let threshold = 0.35;
    if (data.camera_id) {
      const { data: cam } = await supabase
        .from("cameras")
        .select("confidence_threshold")
        .eq("id", data.camera_id)
        .maybeSingle();
      if (cam?.confidence_threshold != null) threshold = cam.confidence_threshold;
    }
    if (a.litter_detected && a.confidence >= threshold) {
      const { data: v, error: vErr } = await supabase
        .from("violations")
        .insert({
          owner_id: userId,
          detection_id: detection.id,
          camera_id: data.camera_id ?? null,
          status: "pending",
          severity: a.severity,
          plate_guess: a.plate_guess || null,
        })
        .select("id")
        .single();
      if (vErr) throw new Error(vErr.message);
      violationId = v.id;
    }

    return { detection_id: detection.id, frame_id: frameId, violation_id: violationId };
  });

export const listDetections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        camera_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("detections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.camera_id) q = q.eq("camera_id", data.camera_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getDetection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("detections")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getFrameSignedUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ path: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("frames")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return signed.signedUrl;
  });
