import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Save,
  Cloud,
  Server,
  Cpu,
  Globe,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftInput } from "@/components/soft/SoftInput";
import { SoftToggle } from "@/components/soft/SoftToggle";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftBadge } from "@/components/soft/SoftBadge";
import {
  useAiSettings,
  PROVIDER_MODELS,
  PROVIDER_LABELS,
  type AiProvider,
} from "@/hooks/useAiSettings";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LitterCam AI" },
      {
        name: "description",
        content:
          "Configure AI provider, model, cameras, thresholds, notifications and officer accounts.",
      },
    ],
  }),
  component: SettingsPage,
});

const providerOptions: Array<{
  value: AiProvider;
  icon: typeof Cloud;
  description: string;
}> = [
  {
    value: "google-vision",
    icon: Cloud,
    description: "Cloud-hosted object detection & labelling",
  },
  {
    value: "ollama",
    icon: Server,
    description: "Local vision models via Ollama server",
  },
  {
    value: "openai",
    icon: Cpu,
    description: "GPT-4o family vision models",
  },
  {
    value: "custom",
    icon: Globe,
    description: "Any OpenAI-compatible inference endpoint",
  },
];

function SettingsPage() {
  const { settings, update, reset, isDirty } = useAiSettings();
  const [showVisionKey, setShowVisionKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveFlash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <TopBar title="Settings" subtitle="Platform configuration" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── AI Provider Selection ─── */}
        <SoftCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg">AI Provider</h2>
            <div className="flex items-center gap-2">
              {isDirty && (
                <SoftBadge tone="gold">Unsaved changes</SoftBadge>
              )}
              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SoftBadge tone="green">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Saved
                  </SoftBadge>
                </motion.div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Choose which AI backend powers detection inference. Settings are
            saved automatically and persist across sessions.
          </p>

          {/* Provider cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            {providerOptions.map(({ value, icon: Icon, description }) => {
              const isActive = settings.provider === value;
              return (
                <button
                  key={value}
                  onClick={() => update({ provider: value })}
                  className={`text-left rounded-[20px] p-4 transition-all ${
                    isActive
                      ? "soft-pressed ring-2 ring-brand-blue/40"
                      : "soft-raised-sm soft-press hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`h-8 w-8 rounded-xl grid place-items-center ${
                        isActive
                          ? "bg-brand-blue/10 text-brand-blue"
                          : "soft-pressed-sm text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-2 w-2 rounded-full bg-brand-blue"
                      />
                    )}
                  </div>
                  <div className="font-bold text-sm">
                    {PROVIDER_LABELS[value]}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    {description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Model selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                Model
              </label>
              <div className="soft-pressed-sm rounded-[18px] mt-1 overflow-hidden">
                <select
                  value={settings.model}
                  onChange={(e) => update({ model: e.target.value })}
                  className="w-full bg-transparent px-5 py-3 text-sm outline-none text-foreground appearance-none cursor-pointer"
                >
                  {PROVIDER_MODELS[settings.provider].map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Provider-specific fields */}
            {settings.provider === "ollama" && (
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Ollama Server URL
                </label>
                <SoftInput
                  value={settings.ollamaUrl}
                  onChange={(e) =>
                    update({ ollamaUrl: e.target.value })
                  }
                  placeholder="http://localhost:11434"
                  className="mt-1"
                />
              </div>
            )}

            {settings.provider === "google-vision" && (
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Vision API Key
                </label>
                <div className="relative mt-1">
                  <SoftInput
                    type={showVisionKey ? "text" : "password"}
                    value={settings.visionApiKey}
                    onChange={(e) =>
                      update({ visionApiKey: e.target.value })
                    }
                    placeholder="AIza…"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVisionKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showVisionKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {settings.provider === "openai" && (
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                  OpenAI API Key
                </label>
                <div className="relative mt-1">
                  <SoftInput
                    type={showOpenaiKey ? "text" : "password"}
                    value={settings.openaiApiKey}
                    onChange={(e) =>
                      update({ openaiApiKey: e.target.value })
                    }
                    placeholder="sk-…"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showOpenaiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {settings.provider === "custom" && (
              <>
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Endpoint URL
                  </label>
                  <SoftInput
                    value={settings.customEndpoint}
                    onChange={(e) =>
                      update({ customEndpoint: e.target.value })
                    }
                    placeholder="https://api.example.com/v1/vision"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-semibold">
                    API Key
                  </label>
                  <div className="relative mt-1">
                    <SoftInput
                      type={showCustomKey ? "text" : "password"}
                      value={settings.customApiKey}
                      onChange={(e) =>
                        update({ customApiKey: e.target.value })
                      }
                      placeholder="Bearer token or API key"
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCustomKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </SoftCard>

        {/* ─── AI Model Settings ─── */}
        <SoftCard>
          <h2 className="font-bold text-lg mb-1">Inference Settings</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Detection thresholds and inference behaviour
          </p>

          <label className="text-[10px] uppercase text-muted-foreground">
            Detection confidence threshold:{" "}
            <span className="text-brand-blue font-bold">
              {settings.confidenceThreshold}%
            </span>
          </label>
          <input
            type="range"
            min={50}
            max={99}
            value={settings.confidenceThreshold}
            onChange={(e) =>
              update({ confidenceThreshold: Number(e.target.value) })
            }
            className="w-full mt-2 accent-[color:var(--brand-blue)]"
          />

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">False-positive suppression</span>
              <SoftToggle
                checked={settings.falsePositiveSuppression}
                onChange={(v) => update({ falsePositiveSuppression: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm">Auto-approve high-confidence</span>
                <div className="text-[10px] text-muted-foreground">
                  Skip review for detections above threshold
                </div>
              </div>
              <SoftToggle
                checked={settings.autoApprove}
                onChange={(v) => update({ autoApprove: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time streaming inference</span>
              <SoftToggle
                checked={settings.realtimeStreaming}
                onChange={(v) => update({ realtimeStreaming: v })}
              />
            </div>
          </div>

          {/* Current config summary */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="soft-pressed-sm rounded-2xl p-3">
              <div className="text-[10px] uppercase text-muted-foreground">
                Provider
              </div>
              <div className="font-bold text-sm">
                {PROVIDER_LABELS[settings.provider]}
              </div>
            </div>
            <div className="soft-pressed-sm rounded-2xl p-3">
              <div className="text-[10px] uppercase text-muted-foreground">
                Model
              </div>
              <div className="font-bold text-sm truncate">
                {PROVIDER_MODELS[settings.provider].find(
                  (m) => m.value === settings.model,
                )?.label ?? settings.model}
              </div>
            </div>
            {settings.provider === "ollama" && (
              <div className="soft-pressed-sm rounded-2xl p-3 col-span-2">
                <div className="text-[10px] uppercase text-muted-foreground">
                  Ollama URL
                </div>
                <div className="font-bold text-sm font-mono truncate">
                  {settings.ollamaUrl}
                </div>
              </div>
            )}
          </div>
        </SoftCard>

        {/* ─── Camera Management ─── */}
        <SoftCard>
          <h2 className="font-bold text-lg mb-1">Camera management</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Add or update stream URLs
          </p>
          <label className="text-[10px] uppercase text-muted-foreground">
            Camera name
          </label>
          <SoftInput placeholder="Main St & 5th" className="mt-1 mb-3" />
          <label className="text-[10px] uppercase text-muted-foreground">
            RTSP URL
          </label>
          <SoftInput placeholder="rtsp://…" className="mt-1 mb-3" />
          <SoftButton variant="primary">Register camera</SoftButton>
        </SoftCard>

        {/* ─── Notifications ─── */}
        <SoftCard>
          <h2 className="font-bold text-lg mb-1">Notifications & Display</h2>
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <SoftToggle
                checked={settings.pushNotifications}
                onChange={(v) => update({ pushNotifications: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark mode</span>
              <SoftToggle
                checked={settings.darkMode}
                onChange={(v) => update({ darkMode: v })}
              />
            </div>
          </div>
        </SoftCard>

        {/* ─── Officer accounts ─── */}
        <SoftCard>
          <h2 className="font-bold text-lg mb-1">Officer accounts</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Authorized reviewers
          </p>
          <div className="flex flex-col gap-2">
            {[
              { name: "Officer Mora", role: "Lead reviewer" },
              { name: "Officer Chen", role: "Traffic unit" },
              { name: "Officer Kane", role: "Night shift" },
            ].map((o) => (
              <div
                key={o.name}
                className="soft-pressed-sm rounded-2xl p-3 flex items-center gap-3"
              >
                <div className="soft-raised-sm h-9 w-9 rounded-full grid place-items-center text-xs font-black text-brand-blue">
                  {o.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm">{o.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {o.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        {/* ─── API Keys & Actions ─── */}
        <SoftCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg">API Keys & Session</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Integration credentials for external city systems. All settings
            auto-save to browser storage.
          </p>
          <SoftInput
            readOnly
            value="lck_live_••••••••••••••••4291"
            className="mb-4"
          />

          <div className="flex flex-wrap gap-3">
            <SoftButton
              variant="primary"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSaveFlash}
            >
              Confirm saved
            </SoftButton>
            <SoftButton
              variant="danger"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={reset}
            >
              Reset to defaults
            </SoftButton>
          </div>

          {isDirty && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-muted-foreground mt-3"
            >
              Settings are auto-saved to <code className="font-mono text-brand-blue">localStorage</code> on
              every change. They persist across page refreshes and browser
              restarts.
            </motion.p>
          )}
        </SoftCard>
      </div>
    </>
  );
}
