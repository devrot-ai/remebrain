import { useCallback, useRef, useState } from "react";
import { Upload, Sparkles, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { analyzeImage } from "@/lib/ai/analyzeImage";
import { useAiSettings, activeOllamaUrl } from "@/lib/ai/settings";
import type { AnalysisResult } from "@/lib/ai/types";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AnalyzerCard() {
  const [settings] = useAiSettings();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = useCallback(async (file: File) => {
    setResult(null);
    setError(null);
    try {
      const url = await fileToDataUrl(file);
      setImageUrl(url);
    } catch {
      toast.error("Could not read that image file.");
    }
  }, []);

  const onRun = useCallback(async () => {
    if (!imageUrl || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await analyzeImage(imageUrl);
      setResult(r);
      toast.success(
        r.analysis.litter_detected
          ? `Violation detected · ${(r.analysis.confidence * 100).toFixed(0)}%`
          : "No violation detected",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [imageUrl, busy]);

  const providerLabel =
    settings.provider === "lovable"
      ? `Lovable AI · ${settings.lovableModel}`
      : `Ollama · ${settings.ollamaModel} · ${activeOllamaUrl(settings) || "not set"}`;

  return (
    <SoftCard className="!p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Live Vision Inference
          </div>
          <h2 className="text-lg font-bold">Analyze a camera frame</h2>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            Provider: <span className="font-semibold text-foreground">{providerLabel}</span>
          </div>
        </div>
        <SoftBadge tone={settings.provider === "lovable" ? "blue" : "gold"}>
          {settings.provider === "lovable" ? "Cloud" : "Local"}
        </SoftBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="soft-pressed rounded-[24px] aspect-video grid place-items-center overflow-hidden relative cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void onPick(f);
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Frame to analyze" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center px-6">
              <div className="soft-raised-sm h-12 w-12 rounded-2xl grid place-items-center mx-auto text-brand-blue">
                <Upload className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div className="text-sm font-semibold mt-3">Drop a frame or click to upload</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                JPG / PNG / WebP · a photo of a car window, road, or camera still
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPick(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <SoftButton
              variant="primary"
              onClick={onRun}
              disabled={!imageUrl || busy}
              icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              className="flex-1"
            >
              {busy ? "Analyzing…" : "Run inference"}
            </SoftButton>
            {imageUrl && (
              <SoftButton
                variant="ghost"
                onClick={() => {
                  setImageUrl(null);
                  setResult(null);
                  setError(null);
                }}
              >
                Clear
              </SoftButton>
            )}
          </div>

          {error && (
            <div className="soft-pressed-sm rounded-2xl p-3 flex gap-2 text-sm text-brand-red">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}

          {result && <ResultPanel result={result} />}

          {!result && !error && (
            <div className="soft-pressed-sm rounded-2xl p-4 text-xs text-muted-foreground">
              Results appear here. Ollama runs entirely in your browser and never touches
              our servers — start it with{" "}
              <code className="font-mono text-[11px]">OLLAMA_ORIGINS=&quot;*&quot; ollama serve</code>{" "}
              first.
            </div>
          )}
        </div>
      </div>
    </SoftCard>
  );
}

function ResultPanel({ result }: { result: AnalysisResult }) {
  const a = result.analysis;
  const detected = a.litter_detected;
  return (
    <div className="soft-pressed rounded-[20px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {detected ? (
          <CheckCircle2 className="h-5 w-5 text-brand-red" />
        ) : (
          <XCircle className="h-5 w-5 text-brand-green" />
        )}
        <div className="font-bold">
          {detected ? "Littering violation detected" : "No violation"}
        </div>
        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          {result.latencyMs} ms
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Field label="Confidence" value={`${(a.confidence * 100).toFixed(0)}%`} />
        <Field label="Severity" value={a.severity} />
        <Field label="Litter" value={a.litter_type || "—"} />
        <Field label="Vehicle" value={`${a.vehicle_color} ${a.vehicle}`.trim()} />
        <Field label="Plate" value={a.plate_guess || "—"} />
        <Field label="Model" value={result.model} />
      </div>

      {a.reasoning && (
        <div className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
          <span className="uppercase tracking-wider text-[10px] font-bold text-foreground/70">
            Reasoning ·
          </span>{" "}
          {a.reasoning}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-pressed-sm rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-bold truncate">{value}</div>
    </div>
  );
}
