import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCamerasTool from "./tools/list-cameras";
import listViolationsTool from "./tools/list-violations";
import getViolationTool from "./tools/get-violation";
import reviewViolationTool from "./tools/review-violation";
import listDetectionsTool from "./tools/list-detections";

// The OAuth issuer must be the direct Supabase host, built from the project ref
// literal that Vite inlines at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "littercam-ai",
  title: "LitterCam AI",
  version: "0.1.0",
  instructions:
    "Tools for LitterCam AI, a traffic littering enforcement platform. Use `list_cameras` for camera inventory, `list_detections` for raw AI detections, `list_violations` / `get_violation` to inspect violation reports, and `review_violation` to record an officer approve/reject decision. All data is scoped to the signed-in officer.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCamerasTool,
    listDetectionsTool,
    listViolationsTool,
    getViolationTool,
    reviewViolationTool,
  ],
});
