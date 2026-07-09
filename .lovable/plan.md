
# M1 + M2 — Persistence & Live Ingestion

Turn LitterCam from a mock UI + one-off analyzer into a real system: signed-in users can register cameras, stream frames from a webcam, auto-analyze every N seconds, and see all detections/violations persist across sessions.

## Scope

**In:** DB schema, RLS, server fns for CRUD, webcam capture UI, auto-sample loop, wiring existing pages to real data.
**Out (later milestones):** review/approval workflow (M3), Ollama server proxy, PDF reports, notifications, RTSP/edge-device ingestion.

## 1. Database schema (single migration)

Tables in `public`, all with RLS + explicit GRANTs. All user-scoped by `owner_id = auth.uid()`.

```text
app_role (enum)          admin | reviewer | user
user_roles               user_id, role  — required for future admin/review
profiles                 id (=auth.uid), display_name, avatar_url
cameras                  id, owner_id, name, location, lat, lng, active, created_at
frames                   id, camera_id, owner_id, image_url (storage), captured_at
detections               id, frame_id, camera_id, owner_id,
                         provider, model, latency_ms,
                         litter_detected, confidence, litter_type,
                         vehicle, vehicle_color, plate_guess,
                         severity, reasoning, raw, created_at
violations               id, detection_id, camera_id, owner_id,
                         status (pending|confirmed|dismissed),
                         severity, plate_guess, created_at
```

- `has_role(uuid, app_role)` security-definer function (per user-roles rules).
- RLS: users read/write their own rows (`owner_id = auth.uid()`); admins/reviewers get broader read via `has_role`.
- Storage bucket `frames` (private) for captured images; RLS'd so users only read their own paths.
- `updated_at` trigger where relevant.
- `profiles` auto-created via `handle_new_user` trigger on `auth.users` insert.

## 2. Server functions (`src/lib/*.functions.ts`)

All use `.middleware([requireSupabaseAuth])`.

- `cameras.functions.ts` — `listCameras`, `createCamera`, `updateCamera`, `deleteCamera`.
- `detections.functions.ts` — `listDetections({ cameraId?, limit, cursor })`, `getDetection(id)`, `saveDetection(payload)` (called after every analyze).
- `violations.functions.ts` — `listViolations`, `getViolation(id)`, `createViolationFromDetection(detectionId)` (auto-called when `litter_detected && confidence >= threshold`).
- `frames.functions.ts` — `createFrameUploadUrl()` returns a signed upload URL to storage, then `recordFrame({ camera_id, storage_path, captured_at })`.

`analyze.functions.ts` stays as-is (Lovable AI Gateway call). New `analyzeAndPersist` client helper: upload frame → call analyzer → `saveDetection` → conditionally `createViolationFromDetection`.

## 3. UI wiring

- **Cameras page (`_app/cameras.tsx`)**: real list from `listCameras`, "Add camera" dialog (name/location), delete/edit.
- **New: Camera detail page `_app/cameras.$id.tsx`**:
  - Left: live `<video>` webcam preview via `getUserMedia`.
  - Controls: Start/Stop, capture interval (default 5s), provider badge.
  - Loop: every N seconds → grab `<canvas>` frame → JPEG dataURL → `analyzeImage` → if kept, upload to storage + persist detection.
  - Right: last 20 detections stream (live via TanStack Query invalidation).
- **Dashboard (`_app/index.tsx`)**: counts (today/week) from real `detections` + `violations`, replace mock KPIs.
- **Detections (`_app/detections.tsx`)**: paginated list from `listDetections`; keep AnalyzerCard for ad-hoc testing but also persist its result.
- **Violations (`_app/violations.tsx` + `violations.$id.tsx`)**: real data from `listViolations` / `getViolation`.
- All lists use `useSuspenseQuery` + `ensureQueryData` in loaders (project's canonical pattern).

## 4. Auto-sampling loop details (technical)

- Runs only on the camera detail page while "Start" is active; cleared on unmount/stop.
- Skips upload+save when previous call still in flight (single-flight).
- Client-side gate: only persist when `confidence >= 0.35` OR `litter_detected === true`, to avoid DB spam from Gemini "no violation" frames. Configurable per camera.
- Frame JPEG quality 0.7, max 1280px longest side, to stay under gateway payload limits and storage cost.

## 5. Files touched / created

**New:** migration SQL; `src/lib/cameras.functions.ts`, `detections.functions.ts`, `violations.functions.ts`, `frames.functions.ts`; `src/routes/_app/cameras.$id.tsx`; `src/components/WebcamCaptureCard.tsx`; `src/lib/ai/persist.ts` (wrapper).

**Edited:** `_app/cameras.tsx`, `_app/index.tsx`, `_app/detections.tsx`, `_app/violations.tsx`, `_app/violations.$id.tsx`, `AnalyzerCard.tsx` (persist result), `src/lib/mock/*` (removed once pages migrate).

## 6. Order of work

1. Migration (schema + RLS + grants + storage bucket + roles + profile trigger).
2. Server functions for cameras + detections + frames + violations.
3. Cameras page real CRUD.
4. Camera detail page with webcam capture + auto-analyze + persist.
5. Migrate Dashboard/Detections/Violations pages off mock.
6. Delete unused mock modules.

## 7. Assumptions / decisions I'm defaulting

- Auth already works (Google + email) — reuse.
- Confidence threshold **0.35** and interval **5s** are defaults, exposed in per-camera settings later.
- Frames stored in Supabase Storage private bucket; signed URLs generated on read.
- No cross-user visibility yet (owner-only). Admin/reviewer read paths are stubbed via `has_role` for M3.
- Realtime updates via query invalidation on save, not Postgres realtime channels (simpler, enough for one active tab).

## 8. Explicitly deferred

- Approval/rejection queue and violation state transitions (M3).
- Ollama server-side proxy (M4).
- Aggregations for heatmap/reports/analytics pages — will still show mock or empty state after M1+M2; wired in a follow-up.
- Edge-device / RTSP ingestion endpoint under `/api/public/*`.

Approve to proceed with the migration first.
