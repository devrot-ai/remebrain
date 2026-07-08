export interface LitterAnalysis {
  litter_detected: boolean;
  confidence: number;
  litter_type: string;
  vehicle: string;
  vehicle_color: string;
  plate_guess: string;
  severity: "low" | "medium" | "high";
  reasoning: string;
}

export interface AnalysisResult {
  provider: "lovable" | "ollama";
  model: string;
  latencyMs: number;
  analysis: LitterAnalysis;
  raw?: string;
}

export type AiProvider = "lovable" | "ollama";

export interface AiSettings {
  provider: AiProvider;
  lovableModel: string;
  ollamaMode: "local" | "remote";
  ollamaLocalUrl: string;
  ollamaRemoteUrl: string;
  ollamaModel: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: "lovable",
  lovableModel: "google/gemini-2.5-flash",
  ollamaMode: "local",
  ollamaLocalUrl: "http://localhost:11434",
  ollamaRemoteUrl: "",
  ollamaModel: "llava:latest",
};
