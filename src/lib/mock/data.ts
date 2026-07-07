export type CameraStatus = "online" | "degraded" | "offline";

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: CameraStatus;
  fps: number;
  confidence: number;
  quality: number; // 0..1
  lat: number;
  lng: number;
}

export interface Detection {
  id: string;
  cameraId: string;
  cameraName: string;
  plate: string;
  vehicle: string;
  color: string;
  timestamp: string;
  gps: string;
  confidence: number;
  litter: string;
  status: "pending" | "approved" | "rejected" | "false_positive";
  severity: "low" | "medium" | "high";
}

const rand = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const cameras: Camera[] = [
  { id: "C-001", name: "Main St & 5th", location: "Downtown", status: "online", fps: 29, confidence: 0.94, quality: 0.96, lat: 34, lng: 22 },
  { id: "C-002", name: "Harbor Bridge N", location: "Harbor", status: "online", fps: 30, confidence: 0.91, quality: 0.92, lat: 18, lng: 55 },
  { id: "C-003", name: "Industrial Loop", location: "West Zone", status: "degraded", fps: 22, confidence: 0.78, quality: 0.7, lat: 62, lng: 12 },
  { id: "C-004", name: "Airport Freeway", location: "East Highway", status: "online", fps: 30, confidence: 0.96, quality: 0.98, lat: 76, lng: 68 },
  { id: "C-005", name: "Riverside Park", location: "Green Belt", status: "online", fps: 28, confidence: 0.89, quality: 0.88, lat: 42, lng: 78 },
  { id: "C-006", name: "North Terminal", location: "Transit Hub", status: "offline", fps: 0, confidence: 0, quality: 0, lat: 12, lng: 85 },
];

const plates = ["7XQ-482", "AK-3120", "PLT-902", "9GT-118", "MZ-6640", "44-JR-7", "TX-5580", "BR-2091"];
const vehicles = ["Sedan", "SUV", "Pickup", "Van", "Motorcycle", "Bus"];
const colors = ["White", "Black", "Silver", "Blue", "Red", "Gray"];
const litters = ["Plastic bottle", "Cigarette", "Paper cup", "Fast food bag", "Aluminum can", "Napkin"];
const statuses: Detection["status"][] = ["pending", "approved", "rejected", "false_positive"];

export const detections: Detection[] = Array.from({ length: 42 }).map((_, i) => {
  const r = rand(i + 7);
  const cam = cameras[Math.floor(r() * cameras.length)];
  const status = i < 12 ? "pending" : statuses[Math.floor(r() * statuses.length)];
  const t = new Date(Date.now() - i * 1000 * 60 * (5 + Math.floor(r() * 40)));
  return {
    id: `V-${(10428 - i).toString()}`,
    cameraId: cam.id,
    cameraName: cam.name,
    plate: plates[Math.floor(r() * plates.length)],
    vehicle: vehicles[Math.floor(r() * vehicles.length)],
    color: colors[Math.floor(r() * colors.length)],
    timestamp: t.toISOString(),
    gps: `${(37.7 + r() * 0.05).toFixed(4)}, ${(-122.4 + r() * 0.05).toFixed(4)}`,
    confidence: 0.7 + r() * 0.29,
    litter: litters[Math.floor(r() * litters.length)],
    status,
    severity: r() > 0.7 ? "high" : r() > 0.4 ? "medium" : "low",
  };
});

export const violationsOverTime = Array.from({ length: 14 }).map((_, i) => {
  const r = rand(i + 3);
  return {
    day: `D${i + 1}`,
    violations: Math.floor(20 + r() * 60),
    approved: Math.floor(10 + r() * 40),
  };
});

export const litterTypes = litters.map((l, i) => ({
  name: l,
  value: Math.floor(20 + rand(i + 1)() * 90),
}));

export const hourlyLoad = Array.from({ length: 24 }).map((_, h) => ({
  hour: `${h.toString().padStart(2, "0")}`,
  events: Math.floor(5 + Math.sin(h / 3) * 8 + rand(h + 11)() * 15 + (h > 6 && h < 20 ? 15 : 3)),
}));

export const cameraPerf = cameras.map((c) => ({
  name: c.id,
  accuracy: Math.floor(c.confidence * 100),
  uptime: c.status === "offline" ? 0 : Math.floor(85 + Math.random() * 14),
}));

export const pipelineSteps = [
  { key: "frame", label: "Video Frame" },
  { key: "vehicle", label: "Vehicle Detection" },
  { key: "track", label: "Object Tracking" },
  { key: "pose", label: "Human Pose" },
  { key: "hand", label: "Hand Motion" },
  { key: "trash", label: "Trash Detection" },
  { key: "traj", label: "Trajectory" },
  { key: "assoc", label: "Vehicle Match" },
  { key: "plate", label: "License Plate" },
  { key: "evidence", label: "Evidence" },
  { key: "review", label: "Human Review" },
  { key: "approved", label: "Approved Fine" },
] as const;

export const heatmapHotspots = [
  { x: 32, y: 28, intensity: 0.9 },
  { x: 55, y: 42, intensity: 0.7 },
  { x: 70, y: 62, intensity: 0.85 },
  { x: 22, y: 68, intensity: 0.55 },
  { x: 82, y: 22, intensity: 0.6 },
  { x: 45, y: 80, intensity: 0.5 },
];
