import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Cloud, Server } from "lucide-react";
import { toast } from "sonner";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftInput } from "@/components/soft/SoftInput";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { useAiSettings, activeOllamaUrl } from "@/lib/ai/settings";
import { pingOllama } from "@/lib/ai/ollama";
import type { AiProvider, AiSettings } from "@/lib/ai/types";

const LOVABLE_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "google/gemini-3-flash-preview",
];

export function AiProviderCard() {
  const [settings, setSettings] = useAiSettings();
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<
    { ok: boolean; message: string } | null
  >(null);

  const patch = (p: Partial<AiSettings>) => setSettings({ ...settings, ...p });

  const testOllama = async () => {
    const url = activeOllamaUrl(settings).trim();
    if (!url) {
      toast.error("Set an Ollama URL first.");
      return;
    }
    setProbing(true);
    setProbeResult(null);
    try {
      const models = await pingOllama(url);
      const found = models.includes(settings.ollamaModel);
      setProbeResult({
        ok: true,
        message: found
          ? `Connected · found ${models.length} model${models.length === 1 ? "" : "s"}, including ${settings.ollamaModel}.`
          : `Connected · ${models.length} model${models.length === 1 ? "" : "s"} available (${models.slice(0, 3).join(", ")}). Pull "${settings.ollamaModel}" with: ollama pull ${settings.ollamaModel}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unreachable";
      setProbeResult({
        ok: false,
        message: `${msg}. If running locally, start Ollama with: OLLAMA_ORIGINS="*" ollama serve`,
      });
    } finally {
      setProbing(false);
    }
  };

  return (
    <SoftCard className="xl:col-span-2">
      <h2 className="font-bold text-lg mb-1">Vision AI provider</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Choose which model runs the litter-detection inference on uploaded camera frames.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <ProviderTile
          active={settings.provider === "lovable"}
          onClick={() => patch({ provider: "lovable" })}
          icon={<Cloud className="h-4 w-4" strokeWidth={2.25} />}
          title="Lovable AI (cloud)"
          subtitle="Ready to use · Gemini vision models · no key needed"
          tone="blue"
        />
        <ProviderTile
          active={settings.provider === "ollama"}
          onClick={() => patch({ provider: "ollama" })}
          icon={<Server className="h-4 w-4" strokeWidth={2.25} />}
          title="Your own Ollama"
          subtitle="Runs locally · llava, bakllava, moondream, etc."
          tone="gold"
        />
      </div>

      {settings.provider === "lovable" && (
        <div className="soft-pressed rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Model
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {LOVABLE_MODELS.map((m) => (
              <button
                key={m}
                onClick={() => patch({ lovableModel: m })}
                className={`soft-raised-sm soft-press rounded-xl px-3 py-2 text-xs font-semibold truncate ${
                  settings.lovableModel === m ? "text-brand-blue" : "text-muted-foreground"
                }`}
              >
                {m.replace("google/", "")}
              </button>
            ))}
          </div>
        </div>
      )}

      {settings.provider === "ollama" && (
        <div className="flex flex-col gap-4">
          <div className="soft-pressed rounded-2xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Connection mode
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ModeToggle
                active={settings.ollamaMode === "local"}
                onClick={() => patch({ ollamaMode: "local" })}
                title="Direct (localhost)"
                subtitle="Browser → your machine"
              />
              <ModeToggle
                active={settings.ollamaMode === "remote"}
                onClick={() => patch({ ollamaMode: "remote" })}
                title="Remote URL"
                subtitle="ngrok / Cloudflare Tunnel"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">
                {settings.ollamaMode === "local" ? "Local Ollama URL" : "Public Ollama URL"}
              </label>
              <SoftInput
                className="mt-1"
                placeholder={
                  settings.ollamaMode === "local"
                    ? "http://localhost:11434"
                    : "https://xxxx.ngrok-free.app"
                }
                value={
                  settings.ollamaMode === "local"
                    ? settings.ollamaLocalUrl
                    : settings.ollamaRemoteUrl
                }
                onChange={(e) =>
                  patch(
                    settings.ollamaMode === "local"
                      ? { ollamaLocalUrl: e.target.value }
                      : { ollamaRemoteUrl: e.target.value },
                  )
                }
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Vision model</label>
              <SoftInput
                className="mt-1"
                placeholder="llava:latest"
                value={settings.ollamaModel}
                onChange={(e) => patch({ ollamaModel: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SoftButton
              variant="primary"
              onClick={testOllama}
              disabled={probing}
              icon={probing ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {probing ? "Testing…" : "Test connection"}
            </SoftButton>
            {probeResult && (
              <SoftBadge tone={probeResult.ok ? "green" : "red"}>
                {probeResult.ok ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {probeResult.ok ? "Reachable" : "Unreachable"}
              </SoftBadge>
            )}
          </div>

          {probeResult && (
            <div className="soft-pressed-sm rounded-2xl p-3 text-xs text-muted-foreground">
              {probeResult.message}
            </div>
          )}

          <div className="soft-pressed-sm rounded-2xl p-3 text-[11px] text-muted-foreground leading-relaxed">
            <div className="font-bold text-foreground mb-1">Ollama quick start</div>
            1. Install from <span className="font-mono">ollama.com</span>
            <br />
            2. Pull a vision model:{" "}
            <span className="font-mono">ollama pull {settings.ollamaModel}</span>
            <br />
            3. Start with CORS open so the browser can reach it:{" "}
            <span className="font-mono">OLLAMA_ORIGINS=&quot;*&quot; ollama serve</span>
            {settings.ollamaMode === "remote" && (
              <>
                <br />
                4. Expose publicly:{" "}
                <span className="font-mono">ngrok http 11434</span> and paste the URL above.
              </>
            )}
          </div>
        </div>
      )}
    </SoftCard>
  );
}

function ProviderTile({
  active,
  onClick,
  icon,
  title,
  subtitle,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "blue" | "gold";
}) {
  const toneClass = tone === "blue" ? "text-brand-blue" : "text-brand-gold";
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-[20px] p-4 transition-all ${
        active ? "soft-pressed" : "soft-raised-sm soft-press hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`soft-pressed-sm h-8 w-8 rounded-xl grid place-items-center ${toneClass}`}>
          {icon}
        </div>
        <div className="font-bold">{title}</div>
        {active && <SoftBadge tone={tone} className="ml-auto">Active</SoftBadge>}
      </div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </button>
  );
}

function ModeToggle({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl px-3 py-2 ${
        active ? "soft-pressed-sm text-brand-blue" : "soft-raised-sm soft-press text-muted-foreground"
      }`}
    >
      <div className="text-xs font-bold">{title}</div>
      <div className="text-[10px] mt-0.5 opacity-80">{subtitle}</div>
    </button>
  );
}
