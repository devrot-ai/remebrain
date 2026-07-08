import { analyzeFrameLovable } from "./analyze.functions";
import { callOllamaVision } from "./ollama";
import { parseLitterAnalysis } from "./parse";
import { activeOllamaUrl, loadAiSettings } from "./settings";
import type { AnalysisResult } from "./types";

/**
 * Unified entry point: runs the currently configured provider (Lovable AI
 * Gateway on the server, or user-hosted Ollama in the browser) and returns
 * a normalized LitterAnalysis. Throws on any failure.
 */
export async function analyzeImage(imageDataUrl: string): Promise<AnalysisResult> {
  const settings = loadAiSettings();

  if (settings.provider === "ollama") {
    const baseUrl = activeOllamaUrl(settings).trim();
    if (!baseUrl) {
      throw new Error(
        settings.ollamaMode === "remote"
          ? "Set a remote Ollama URL in Settings (e.g. an ngrok URL)."
          : "Set the local Ollama URL in Settings.",
      );
    }
    const { model, latencyMs, raw } = await callOllamaVision({
      baseUrl,
      model: settings.ollamaModel,
      imageDataUrl,
    });
    return {
      provider: "ollama",
      model,
      latencyMs,
      analysis: parseLitterAnalysis(raw),
      raw,
    };
  }

  const { model, latencyMs, raw } = await analyzeFrameLovable({
    data: { imageDataUrl, model: settings.lovableModel },
  });
  return {
    provider: "lovable",
    model,
    latencyMs,
    analysis: parseLitterAnalysis(raw),
    raw,
  };
}
