import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AnalyticsData {
  violationsOverTime: { day: string; violations: number; approved: number }[];
  litterTypes: { name: string; value: number }[];
  hourlyLoad: { hour: string; events: number }[];
  cameraPerf: { name: string; detections: number; violations: number }[];
  cameras: {
    id: string;
    name: string;
    location: string | null;
    active: boolean;
    lat: number | null;
    lng: number | null;
    violations: number;
  }[];
}

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsData> => {
    const { supabase } = context;
    const since = new Date(Date.now() - 14 * 86400000);
    since.setHours(0, 0, 0, 0);

    const [det, vio, cam] = await Promise.all([
      supabase
        .from("detections")
        .select("camera_id, litter_detected, litter_type, created_at")
        .gte("created_at", since.toISOString())
        .limit(5000),
      supabase
        .from("violations")
        .select("camera_id, status, created_at")
        .gte("created_at", since.toISOString())
        .limit(5000),
      supabase.from("cameras").select("id, name, location, active, lat, lng"),
    ]);
    if (det.error) throw new Error(det.error.message);
    if (vio.error) throw new Error(vio.error.message);
    if (cam.error) throw new Error(cam.error.message);

    const days: AnalyticsData["violationsOverTime"] = [];
    const dayIdx = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayIdx.set(key, i);
      days.push({ day: d.toLocaleDateString("en", { month: "short", day: "numeric" }), violations: 0, approved: 0 });
    }
    const camVio = new Map<string, number>();
    for (const v of vio.data ?? []) {
      const i = dayIdx.get(v.created_at.slice(0, 10));
      if (i !== undefined) {
        days[i].violations++;
        if (v.status === "confirmed") days[i].approved++;
      }
      if (v.camera_id) camVio.set(v.camera_id, (camVio.get(v.camera_id) ?? 0) + 1);
    }

    const types = new Map<string, number>();
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, events: 0 }));
    const camDet = new Map<string, number>();
    for (const d of det.data ?? []) {
      hours[new Date(d.created_at).getHours()].events++;
      if (d.camera_id) camDet.set(d.camera_id, (camDet.get(d.camera_id) ?? 0) + 1);
      if (d.litter_detected) {
        const t = (d.litter_type || "unknown").toLowerCase();
        types.set(t, (types.get(t) ?? 0) + 1);
      }
    }

    const cameras = (cam.data ?? []).map((c) => ({ ...c, violations: camVio.get(c.id) ?? 0 }));
    return {
      violationsOverTime: days,
      litterTypes: [...types.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value })),
      hourlyLoad: hours,
      cameraPerf: cameras.map((c) => ({
        name: c.name,
        detections: camDet.get(c.id) ?? 0,
        violations: c.violations,
      })),
      cameras,
    };
  });
