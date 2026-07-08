import { useEffect, useState } from "react";
import { DEFAULT_AI_SETTINGS, type AiSettings } from "./types";

const STORAGE_KEY = "littercam.ai-settings.v1";

export function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_AI_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return { ...DEFAULT_AI_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAiSettings(next: AiSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("littercam:ai-settings"));
}

export function useAiSettings(): [AiSettings, (next: AiSettings) => void] {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);

  useEffect(() => {
    setSettings(loadAiSettings());
    const onChange = () => setSettings(loadAiSettings());
    window.addEventListener("littercam:ai-settings", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("littercam:ai-settings", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = (next: AiSettings) => {
    setSettings(next);
    saveAiSettings(next);
  };

  return [settings, update];
}

export function activeOllamaUrl(s: AiSettings): string {
  return s.ollamaMode === "local" ? s.ollamaLocalUrl : s.ollamaRemoteUrl;
}
