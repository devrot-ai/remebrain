/**
 * Persisted AI provider settings hook.
 *
 * Saves all AI configuration to localStorage and restores on mount.
 * Settings survive page refreshes and browser restarts.
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ── Schema ──────────────────────────────────────────────────────────

export type AiProvider = "google-vision" | "ollama" | "openai" | "custom";

export interface AiProviderSettings {
  /** Which AI provider to use */
  provider: AiProvider;
  /** Model name within that provider */
  model: string;
  /** Ollama server URL (only used when provider === "ollama") */
  ollamaUrl: string;
  /** Custom API endpoint (only used when provider === "custom") */
  customEndpoint: string;
  /** Custom API key */
  customApiKey: string;
  /** Detection confidence threshold (50–99) */
  confidenceThreshold: number;
  /** Enable false-positive suppression */
  falsePositiveSuppression: boolean;
  /** Auto-approve violations above confidence threshold */
  autoApprove: boolean;
  /** Enable real-time streaming inference */
  realtimeStreaming: boolean;
  /** Enable push notifications */
  pushNotifications: boolean;
  /** Dark mode */
  darkMode: boolean;
  /** Google Vision API key (stored separately from env for UI override) */
  visionApiKey: string;
  /** OpenAI API key */
  openaiApiKey: string;
}

// ── Defaults ────────────────────────────────────────────────────────

const STORAGE_KEY = "littercam-ai-settings";

export const DEFAULT_SETTINGS: AiProviderSettings = {
  provider: "google-vision",
  model: "gemini-vision",
  ollamaUrl: "http://localhost:11434",
  customEndpoint: "",
  customApiKey: "",
  confidenceThreshold: 85,
  falsePositiveSuppression: false,
  autoApprove: false,
  realtimeStreaming: true,
  pushNotifications: true,
  darkMode: false,
  visionApiKey: "",
  openaiApiKey: "",
};

/** Available models per provider. */
export const PROVIDER_MODELS: Record<AiProvider, Array<{ value: string; label: string }>> = {
  "google-vision": [
    { value: "gemini-vision", label: "Gemini Vision (Cloud)" },
    { value: "vision-api-v1", label: "Vision API v1 (Object Localization)" },
    { value: "vertex-ai", label: "Vertex AI (AutoML)" },
  ],
  ollama: [
    { value: "llava", label: "LLaVA (Vision)" },
    { value: "llava:13b", label: "LLaVA 13B" },
    { value: "bakllava", label: "BakLLaVA" },
    { value: "moondream", label: "Moondream 2" },
    { value: "llama3.2-vision", label: "Llama 3.2 Vision" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  custom: [
    { value: "custom", label: "Custom Model" },
  ],
};

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  "google-vision": "Google Cloud Vision",
  ollama: "Ollama (Local)",
  openai: "OpenAI",
  custom: "Custom Endpoint",
};

// ── Persistence helpers ─────────────────────────────────────────────

function loadSettings(): AiProviderSettings {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle schema migrations
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: AiProviderSettings): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable — silently fail
    console.warn("Failed to persist AI settings to localStorage");
  }
}

// ── Hook ────────────────────────────────────────────────────────────

export interface UseAiSettingsReturn {
  settings: AiProviderSettings;
  /** Update one or more fields. Auto-persists. */
  update: (patch: Partial<AiProviderSettings>) => void;
  /** Reset everything to defaults. */
  reset: () => void;
  /** Whether settings have been modified from defaults. */
  isDirty: boolean;
}

export function useAiSettings(): UseAiSettingsReturn {
  // Load from localStorage on first render only
  const [settings, setSettings] = useState<AiProviderSettings>(loadSettings);
  const isFirstRender = useRef(true);

  // Apply dark mode on mount and on change
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  // Persist on every change (skip the initial load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveSettings(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<AiProviderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // When provider changes, reset model to the first available for that provider
      if (patch.provider && patch.provider !== prev.provider && !patch.model) {
        const models = PROVIDER_MODELS[patch.provider];
        next.model = models[0]?.value ?? "";
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  return { settings, update, reset, isDirty };
}
