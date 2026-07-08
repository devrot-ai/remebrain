/**
 * Google Cloud Vision API REST client.
 *
 * Sends a base64-encoded image to the `images:annotate` endpoint and
 * returns the raw API response.
 */

import type { VisionApiResponse } from "./types";

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

/**
 * Returns the configured API key, or `null` if not set.
 * Because this is a Vite app the env var must be prefixed with `VITE_`.
 */
export function getVisionApiKey(): string | null {
  const key =
    (typeof import.meta !== "undefined" &&
      (import.meta as Record<string, unknown>).env &&
      ((import.meta as Record<string, unknown>).env as Record<string, string>)
        ?.VITE_GOOGLE_VISION_API_KEY) ||
    null;
  return key && key.length > 0 ? key : null;
}

/** Whether the Vision integration is configured. */
export function isVisionConfigured(): boolean {
  return getVisionApiKey() !== null;
}

/**
 * Call the Vision API for a single image.
 *
 * @param base64Image  Base64-encoded image content (no data-URI prefix).
 * @returns            Raw API response.
 */
export async function annotateImage(
  base64Image: string,
): Promise<VisionApiResponse> {
  const apiKey = getVisionApiKey();
  if (!apiKey) {
    throw new Error(
      "Google Vision API key is not configured. " +
        "Set VITE_GOOGLE_VISION_API_KEY in your .env file.",
    );
  }

  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [
          { type: "OBJECT_LOCALIZATION", maxResults: 20 },
          { type: "LABEL_DETECTION", maxResults: 15 },
        ],
      },
    ],
  };

  const res = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vision API request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as VisionApiResponse;
}

/**
 * Convert a `File` to a plain base64 string (no data-URI prefix).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:image/…;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a `File` to a data-URI string for rendering in <img>.
 */
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
