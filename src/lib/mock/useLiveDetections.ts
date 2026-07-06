import { useEffect, useState } from "react";

export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  trackId: number;
  isLitter?: boolean;
}

const labels = [
  { label: "Car", color: "#4a86ff", w: 34, h: 22 },
  { label: "SUV", color: "#4a86ff", w: 40, h: 26 },
  { label: "Bus", color: "#4a86ff", w: 46, h: 30 },
  { label: "Motorcycle", color: "#7d5cff", w: 18, h: 22 },
  { label: "Pedestrian", color: "#f0a742", w: 10, h: 24 },
  { label: "Plate", color: "#5ec48a", w: 14, h: 6 },
];

export function useLiveDetections(seed = 1, litterChance = 0.06) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [litter, setLitter] = useState(false);

  useEffect(() => {
    let id = seed * 100;
    let track = seed * 10;
    const tick = () => {
      const count = 2 + Math.floor(Math.random() * 3);
      const next: Box[] = Array.from({ length: count }).map((_, i) => {
        const spec = labels[Math.floor(Math.random() * labels.length)];
        return {
          id: `b-${id++}`,
          x: 8 + Math.random() * 60,
          y: 30 + Math.random() * 45,
          w: spec.w,
          h: spec.h,
          label: spec.label,
          color: spec.color,
          trackId: track++ % 999,
        };
      });
      const throwing = Math.random() < litterChance;
      if (throwing) {
        next.push({
          id: `l-${id++}`,
          x: 40 + Math.random() * 30,
          y: 20 + Math.random() * 30,
          w: 6,
          h: 6,
          label: "Trash",
          color: "#e15a5a",
          trackId: track++,
          isLitter: true,
        });
        setLitter(true);
        setTimeout(() => setLitter(false), 1400);
      }
      setBoxes(next);
    };
    tick();
    const int = setInterval(tick, 1600 + seed * 120);
    return () => clearInterval(int);
  }, [seed, litterChance]);

  return { boxes, litter };
}
