import { supabase } from "@/integrations/supabase/client";
import { recordCapture } from "@/lib/detections.functions";
import { analyzeImage } from "./analyzeImage";
import type { AnalysisResult } from "./types";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "image/jpeg";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export interface PersistOptions {
  cameraId?: string | null;
  uploadFrame?: boolean;
}

export interface PersistedResult {
  analysis: AnalysisResult;
  detection_id: string;
  frame_id: string | null;
  violation_id: string | null;
  storage_path: string | null;
}

/**
 * Analyzes the frame with the current provider, uploads the JPEG to storage
 * (when requested), and persists frame + detection + optional violation.
 */
export async function analyzeAndPersist(
  imageDataUrl: string,
  opts: PersistOptions = {},
): Promise<PersistedResult> {
  const analysis = await analyzeImage(imageDataUrl);

  let storagePath: string | null = null;
  if (opts.uploadFrame) {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (uid) {
      const blob = dataUrlToBlob(imageDataUrl);
      const path = `${uid}/${opts.cameraId ?? "adhoc"}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("frames").upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: false,
      });
      if (!error) storagePath = path;
    }
  }

  const { detection_id, frame_id, violation_id } = await recordCapture({
    data: {
      camera_id: opts.cameraId ?? null,
      storage_path: storagePath,
      captured_at: new Date().toISOString(),
      provider: analysis.provider,
      model: analysis.model,
      latency_ms: analysis.latencyMs,
      raw: analysis.raw ?? null,
      analysis: analysis.analysis,
    },
  });

  return { analysis, detection_id, frame_id, violation_id, storage_path: storagePath };
}
