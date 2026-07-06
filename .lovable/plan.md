## LitterCam AI — Full Frontend (Mock Data, Soft UI / Neumorphism)

Build a premium smart-city surveillance dashboard entirely on the frontend (TanStack Start + React). All AI, video, and violation data is simulated. No backend.

### Design system

- Background `#e8e8e8`, dark-gray text (no pure black), Nunito font (loaded via `<link>` in `__root.tsx`).
- Semantic tokens in `src/styles.css` (`@theme`) for background, surface, text, muted, and accents blue / green / soft-red / gold — all in OKLCH.
- Reusable Soft UI utilities via `@utility`:
  - `soft-raised` → `12px 12px 24px #c8c8c8, -12px -12px 24px #ffffff`
  - `soft-pressed` → inset variant
  - `soft-hover` → subtle lift on hover, 250ms ease transitions
- Radii: cards 30px, buttons 20px, inputs 18px. Generous whitespace.
- Shared primitives in `src/components/soft/`: `SoftCard`, `SoftButton`, `SoftInput`, `SoftIconButton`, `SoftStat`, `SoftBadge`, `SoftToggle`.

### Layout

`src/routes/_app.tsx` = shell with:
- Left sidebar (collapsible on tablet, drawer on mobile) — nav items with active = raised, hover = lifted.
- Main content (`<Outlet />`).
- Right AI Insights panel (hidden < xl, toggleable).

### Routes (each with unique `head()` metadata)

```
/                → Dashboard (stat cards, mini pipeline, recent detections)
/cameras         → Live Cameras grid (simulated feeds w/ animated SVG bounding boxes)
/detections      → Detection Feed timeline
/violations      → Violations list + details drawer/route
/violations/$id  → Violation Details (video preview, trajectory, approve/reject)
/review          → Human Review queue
/analytics       → Charts (Recharts)
/heatmap         → Stylized SVG city map with animated hotspots
/reports         → Report generator (PDF/CSV/Excel export stubs)
/settings        → Cameras, thresholds, notifications, officers, theme, API keys
/profile         → Officer profile
```

Root route redirects `/` into the `_app` shell containing Dashboard.

### Simulated AI

- `src/lib/mock/` — deterministic mock generators for cameras, detections, violations, officers, analytics series.
- `useLiveDetections()` hook: interval-driven state producing bounding boxes, tracker IDs, confidence, occasional "litter" flash events.
- Camera "video" = looping CSS/SVG scene (road + moving vehicle rectangles) with overlay `<svg>` bounding boxes animated via Framer Motion. No real video assets required.
- AI Pipeline visualization = 12-step vertical/horizontal flow, each step pulses as a mock frame progresses through it.

### Key components

- `Sidebar`, `TopBar`, `AiInsightsPanel`
- `StatCard` (animated count-up via simple RAF hook)
- `CameraFeedCard` (SVG scene + overlays + glow on detection)
- `PipelineFlow` (steps + connectors, active step glows)
- `DetectionTimeline`, `DetectionCard`
- `ViolationDetail` (video preview panel, trajectory SVG, action buttons, officer notes textarea)
- `ReviewCard` (Approve / Reject / Needs More Evidence)
- `CityHeatmap` (SVG grid of streets, red radial-gradient hotspots, camera pins, filter controls)
- `AnalyticsCharts` (line / bar / donut via Recharts, styled with soft shadows)

### Microinteractions

- Framer Motion: card mount fade+lift, hover lift, button press → inset, litter-detect glow (box-shadow keyframe), pulsing violation cards, animated map pins, count-up numbers, smooth chart draw.

### Dependencies to add

- `framer-motion`
- `recharts`
- `@fontsource/nunito` (or CDN link — will use `<link>` in root head per Tailwind v4 rules)

### Out of scope (per user)

- No backend, no auth, no database, no real video, no real AI models. Export buttons are stubs that trigger client-side CSV download of mock data; PDF/Excel show a toast.

### Deliverable

A single cohesive Soft UI dashboard covering every listed page with realistic mock data and lively simulated detections, ready to demo end-to-end.
