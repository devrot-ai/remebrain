import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Signal } from "lucide-react";
import { useLiveDetections } from "@/lib/mock/useLiveDetections";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { CameraInferenceHistory } from "@/components/CameraInferenceHistory";
import type { Camera } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export function CameraFeedCard({ camera, seed }: { camera: Camera; seed: number }) {
  const { boxes, litter, history } = useLiveDetections(seed, camera.status === "online" ? 0.08 : 0);
  const offline = camera.status === "offline";

  const statusTone =
    camera.status === "online" ? "green" : camera.status === "degraded" ? "gold" : "red";

  return (
    <div
      className={cn(
        "soft-raised rounded-[30px] p-5 flex flex-col gap-4 transition-shadow",
      )}
      style={
        litter
          ? { animation: "litter-glow 1.4s ease-in-out" }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <div className="font-bold text-foreground truncate">{camera.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {camera.location} · {camera.id}
          </div>
        </div>
        <SoftBadge tone={statusTone as "green" | "gold" | "red"}>
          {camera.status}
        </SoftBadge>
      </div>

      <div className="soft-pressed rounded-[24px] aspect-video relative overflow-hidden">
        {/* Scene */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #d6dbe3 0%, #b7bfcb 55%, #98a0ad 100%)" }}>
          {/* road */}
          <div className="absolute left-0 right-0 bottom-0 h-1/2" style={{ background: "linear-gradient(180deg,#7b8492,#4a505a)" }} />
          {/* lane dashes */}
          <div className="absolute left-0 right-0 bottom-[24%] h-1 flex gap-4 px-4 opacity-60">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-full w-8 bg-white/80 rounded-sm" />
            ))}
          </div>
          {/* moving vehicles */}
          {!offline && (
            <>
              <motion.div
                className="absolute bottom-[26%] h-8 w-16 rounded-md"
                style={{ background: "#3d4b6b" }}
                animate={{ x: ["-20%", "120%"] }}
                transition={{ duration: 6 + seed, ease: "linear", repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-[10%] h-9 w-20 rounded-md"
                style={{ background: "#6a3838" }}
                animate={{ x: ["120%", "-20%"] }}
                transition={{ duration: 8 + seed * 0.7, ease: "linear", repeat: Infinity }}
              />
            </>
          )}
        </div>

        {/* Overlays */}
        {!offline && (
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <AnimatePresence>
              {boxes.map((b) => (
                <motion.g
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <rect
                    x={`${b.x}%`}
                    y={`${b.y}%`}
                    width={`${b.w}%`}
                    height={`${b.h}%`}
                    fill="none"
                    stroke={b.color}
                    strokeWidth={b.isLitter ? 3 : 1.5}
                    rx={4}
                    style={
                      b.isLitter
                        ? { filter: "drop-shadow(0 0 8px #e15a5a)" }
                        : undefined
                    }
                  />
                  <rect
                    x={`${b.x}%`}
                    y={`${b.y - 3}%`}
                    width={`${b.label.length * 1.2 + 6}%`}
                    height="3%"
                    fill={b.color}
                    rx={2}
                  />
                  <text
                    x={`${b.x + 0.6}%`}
                    y={`${b.y - 0.8}%`}
                    fontSize="9"
                    fill="white"
                    fontWeight="700"
                  >
                    {b.label} #{b.trackId}
                  </text>
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>
        )}

        {/* HUD */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="soft-pressed-sm rounded-full px-2.5 py-1 text-[10px] font-bold bg-black/20 text-white flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", offline ? "bg-brand-red" : "bg-brand-red animate-[soft-pulse_1.4s_ease-in-out_infinite]")} />
            {offline ? "OFFLINE" : "LIVE"}
          </span>
        </div>
        {litter && (
          <div className="absolute top-3 right-3">
            <span className="rounded-full px-3 py-1 text-[10px] font-black bg-brand-red text-white shadow-lg">
              LITTER DETECTED
            </span>
          </div>
        )}
        {offline && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="text-white/80 text-sm font-bold">No signal</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="soft-pressed-sm rounded-2xl py-2">
          <div className="text-[10px] uppercase text-muted-foreground">FPS</div>
          <div className="font-bold text-foreground">{camera.fps}</div>
        </div>
        <div className="soft-pressed-sm rounded-2xl py-2">
          <div className="text-[10px] uppercase text-muted-foreground">Conf.</div>
          <div className="font-bold text-brand-green">
            {(camera.confidence * 100).toFixed(0)}%
          </div>
        </div>
        <div className="soft-pressed-sm rounded-2xl py-2">
          <div className="text-[10px] uppercase text-muted-foreground flex items-center justify-center gap-1">
            <Wifi className="h-3 w-3" />
          </div>
          <div className="font-bold flex items-center justify-center gap-1 text-brand-blue">
            <Signal className="h-3 w-3" />
            {(camera.quality * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Per-camera inference history */}
      {!offline && (
        <CameraInferenceHistory
          cameraName={camera.name}
          history={history}
        />
      )}
    </div>
  );
}
