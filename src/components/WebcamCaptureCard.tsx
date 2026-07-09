import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Square, Video, VideoOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftInput } from "@/components/soft/SoftInput";
import { analyzeAndPersist } from "@/lib/ai/persist";

const MAX_EDGE = 1280;

function grabJpegDataUrl(video: HTMLVideoElement): string | null {
  if (!video.videoWidth) return null;
  const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
  const w = Math.round(video.videoWidth * scale);
  const h = Math.round(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.7);
}

interface Props {
  cameraId: string;
  intervalSec: number;
  onCapture?: () => void;
}

export function WebcamCaptureCard({ cameraId, intervalSec, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [running, setRunning] = useState(false);
  const [interval_, setIntervalSec] = useState(intervalSec);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => undefined);
      }
      setStreaming(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied.");
    }
  }, []);

  const captureOnce = useCallback(async () => {
    if (inFlightRef.current || !videoRef.current) return;
    const dataUrl = grabJpegDataUrl(videoRef.current);
    if (!dataUrl) return;
    inFlightRef.current = true;
    try {
      const r = await analyzeAndPersist(dataUrl, { cameraId, uploadFrame: true });
      const a = r.analysis.analysis;
      setLastResult(
        a.litter_detected
          ? `Violation · ${(a.confidence * 100).toFixed(0)}% · ${a.litter_type || "litter"}`
          : `No violation · ${(a.confidence * 100).toFixed(0)}%`,
      );
      if (a.litter_detected) toast.success(`Violation detected on ${cameraId.slice(0, 8)}`);
      onCapture?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Capture failed.";
      setError(msg);
    } finally {
      inFlightRef.current = false;
    }
  }, [cameraId, onCapture]);

  const start = useCallback(async () => {
    if (!streaming) await startStream();
    setRunning(true);
  }, [streaming, startStream]);

  const stop = useCallback(() => {
    setRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    void captureOnce();
    timerRef.current = setInterval(() => void captureOnce(), Math.max(1, interval_) * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, interval_, captureOnce]);

  useEffect(() => () => stopStream(), [stopStream]);

  return (
    <SoftCard className="!p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Live capture
          </div>
          <h2 className="text-lg font-bold">Webcam ingestion</h2>
        </div>
        <SoftBadge tone={running ? "green" : streaming ? "gold" : "red"}>
          {running ? "Analyzing" : streaming ? "Streaming" : "Idle"}
        </SoftBadge>
      </div>

      <div className="soft-pressed rounded-[24px] aspect-video overflow-hidden mb-4 relative">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
        {!streaming && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <div className="text-center">
              <VideoOff className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm font-semibold">Camera off</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!streaming ? (
          <SoftButton variant="primary" onClick={startStream} icon={<Video className="h-4 w-4" />}>
            Enable camera
          </SoftButton>
        ) : running ? (
          <SoftButton variant="primary" onClick={stop} icon={<Square className="h-4 w-4" />}>
            Stop analyzing
          </SoftButton>
        ) : (
          <SoftButton variant="primary" onClick={start} icon={<Play className="h-4 w-4" />}>
            Start analyzing
          </SoftButton>
        )}
        {streaming && !running && (
          <SoftButton variant="ghost" onClick={stopStream}>
            Disable camera
          </SoftButton>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-[10px] uppercase text-muted-foreground">Every</label>
          <SoftInput
            type="number"
            min={1}
            max={60}
            value={interval_}
            onChange={(e) => setIntervalSec(Math.max(1, Number(e.target.value) || 1))}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">sec</span>
        </div>
      </div>

      {lastResult && (
        <div className="soft-pressed-sm rounded-2xl p-3 mt-4 text-xs font-semibold flex items-center gap-2">
          {inFlightRef.current && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {lastResult}
        </div>
      )}

      {error && (
        <div className="soft-pressed-sm rounded-2xl p-3 mt-3 flex gap-2 text-sm text-brand-red">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </SoftCard>
  );
}
