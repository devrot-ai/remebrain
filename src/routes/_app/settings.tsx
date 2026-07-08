import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftInput } from "@/components/soft/SoftInput";
import { SoftToggle } from "@/components/soft/SoftToggle";
import { SoftButton } from "@/components/soft/SoftButton";
import { AiProviderCard } from "@/components/AiProviderCard";


export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LitterCam AI" },
      { name: "description", content: "Configure cameras, thresholds, notifications and officer accounts." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [notif, setNotif] = useState(true);
  const [dark, setDark] = useState(false);
  const [auto, setAuto] = useState(false);
  const [threshold, setThreshold] = useState(85);

  return (
    <>
      <TopBar title="Settings" subtitle="Platform configuration" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AiProviderCard />

        <SoftCard>

          <h2 className="font-bold text-lg mb-1">AI model settings</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Detection thresholds and inference behaviour
          </p>
          <label className="text-[10px] uppercase text-muted-foreground">
            Detection confidence threshold: <span className="text-brand-blue font-bold">{threshold}%</span>
          </label>
          <input
            type="range"
            min={50}
            max={99}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full mt-2 accent-[color:var(--brand-blue)]"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm">Enable false-positive suppression</span>
            <SoftToggle checked={auto} onChange={setAuto} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="soft-pressed-sm rounded-2xl p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Model</div>
              <div className="font-bold">YOLOv11 · Nano</div>
            </div>
            <div className="soft-pressed-sm rounded-2xl p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Tracker</div>
              <div className="font-bold">ByteTrack</div>
            </div>
            <div className="soft-pressed-sm rounded-2xl p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Plate OCR</div>
              <div className="font-bold">EasyOCR</div>
            </div>
            <div className="soft-pressed-sm rounded-2xl p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Pose</div>
              <div className="font-bold">MediaPipe</div>
            </div>
          </div>
        </SoftCard>

        <SoftCard>
          <h2 className="font-bold text-lg mb-1">Camera management</h2>
          <p className="text-xs text-muted-foreground mb-4">Add or update stream URLs</p>
          <label className="text-[10px] uppercase text-muted-foreground">Camera name</label>
          <SoftInput placeholder="Main St & 5th" className="mt-1 mb-3" />
          <label className="text-[10px] uppercase text-muted-foreground">RTSP URL</label>
          <SoftInput placeholder="rtsp://…" className="mt-1 mb-3" />
          <SoftButton variant="primary">Register camera</SoftButton>
        </SoftCard>

        <SoftCard>
          <h2 className="font-bold text-lg mb-1">Notifications</h2>
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <SoftToggle checked={notif} onChange={setNotif} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark mode</span>
              <SoftToggle
                checked={dark}
                onChange={(v) => {
                  setDark(v);
                  document.documentElement.classList.toggle("dark", v);
                }}
              />
            </div>
          </div>
        </SoftCard>

        <SoftCard>
          <h2 className="font-bold text-lg mb-1">Officer accounts</h2>
          <p className="text-xs text-muted-foreground mb-4">Authorized reviewers</p>
          <div className="flex flex-col gap-2">
            {[
              { name: "Officer Mora", role: "Lead reviewer" },
              { name: "Officer Chen", role: "Traffic unit" },
              { name: "Officer Kane", role: "Night shift" },
            ].map((o) => (
              <div key={o.name} className="soft-pressed-sm rounded-2xl p-3 flex items-center gap-3">
                <div className="soft-raised-sm h-9 w-9 rounded-full grid place-items-center text-xs font-black text-brand-blue">
                  {o.name.split(" ").map((s) => s[0]).join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm">{o.name}</div>
                  <div className="text-[11px] text-muted-foreground">{o.role}</div>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>

        <SoftCard className="xl:col-span-2">
          <h2 className="font-bold text-lg mb-1">API keys</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Integration credentials for external city systems
          </p>
          <SoftInput readOnly value="lck_live_••••••••••••••••4291" />
        </SoftCard>
      </div>
    </>
  );
}
