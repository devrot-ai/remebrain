import { LITTER_SYSTEM_PROMPT, LITTER_USER_PROMPT } from "./prompt";

/**
 * Calls a user-hosted Ollama server directly from the browser.
 *
 * Requires Ollama to allow the current origin via OLLAMA_ORIGINS, e.g.:
 *   OLLAMA_ORIGINS="*" ollama serve
 *
 * For "local" mode Ollama runs on the same machine as the browser
 * (typically http://localhost:11434). For "remote" mode the user has
 * exposed Ollama publicly (e.g. via `ngrok http 11434`).
 */
export async function callOllamaVision(params: {
  baseUrl: string;
  model: string;
  imageDataUrl: string;
  signal?: AbortSignal;
}): Promise<{ model: string; latencyMs: number; raw: string }> {
  const base = params.baseUrl.replace(/\/+$/, "");
  const started = Date.now();

  // Strip the "data:image/xxx;base64," prefix — Ollama wants raw base64.
  const b64 = params.imageDataUrl.includes(",")
    ? params.imageDataUrl.split(",", 2)[1]
    : params.imageDataUrl;

  const response = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      prompt: `${LITTER_SYSTEM_PROMPT}\n\n${LITTER_USER_PROMPT}`,
      images: [b64],
      stream: false,
      format: "json",
      options: { temperature: 0.1 },
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Ollama ${response.status}: ${body.slice(0, 300) || response.statusText}`,
    );
  }

  const json = (await response.json()) as { response?: string };
  return {
    model: params.model,
    latencyMs: Date.now() - started,
    raw: json.response ?? "",
  };
}

/**
 * Cheap connectivity probe. Hits `/api/tags` which lists installed models.
 */
export async function pingOllama(baseUrl: string): Promise<string[]> {
  const base = baseUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}/api/tags`);
  if (!res.ok) throw new Error(`Ollama ${res.status} at ${base}`);
  const json = (await res.json()) as { models?: Array<{ name: string }> };
  return (json.models ?? []).map((m) => m.name);
}
