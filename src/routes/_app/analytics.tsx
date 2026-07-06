import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { violationsOverTime, litterTypes, hourlyLoad, cameraPerf } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — LitterCam AI" },
      { name: "description", content: "Trends, accuracy and camera performance analytics." },
    ],
  }),
  component: AnalyticsPage,
});

const colors = ["#4a86ff", "#5ec48a", "#f0b95c", "#e15a5a", "#8f6cff", "#4dc3d1"];

function AnalyticsPage() {
  return (
    <>
      <TopBar title="Analytics" subtitle="City-wide performance metrics" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <SoftCard className="xl:col-span-2">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Violations vs Approvals · last 14 days
          </div>
          <h2 className="font-bold mb-4">Trend</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={violationsOverTime}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4a86ff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#4a86ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5ec48a" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#5ec48a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#c8c8c8" opacity={0.4} />
                <XAxis dataKey="day" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: "#e8e8e8", border: "none", borderRadius: 16, boxShadow: "6px 6px 12px #c8c8c8,-6px -6px 12px #fff" }} />
                <Area type="monotone" dataKey="violations" stroke="#4a86ff" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="approved" stroke="#5ec48a" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SoftCard>

        <SoftCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Most common litter
          </div>
          <h2 className="font-bold mb-4">By type</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={litterTypes} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={4}>
                  {litterTypes.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#e8e8e8", border: "none", borderRadius: 16, boxShadow: "6px 6px 12px #c8c8c8,-6px -6px 12px #fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SoftCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SoftCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Hourly detection load
          </div>
          <h2 className="font-bold mb-4">24-hour cycle</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={hourlyLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c8c8c8" opacity={0.4} />
                <XAxis dataKey="hour" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: "#e8e8e8", border: "none", borderRadius: 16, boxShadow: "6px 6px 12px #c8c8c8,-6px -6px 12px #fff" }} />
                <Line type="monotone" dataKey="events" stroke="#f0b95c" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SoftCard>

        <SoftCard>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Camera performance
          </div>
          <h2 className="font-bold mb-4">Accuracy vs uptime</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={cameraPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c8c8c8" opacity={0.4} />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: "#e8e8e8", border: "none", borderRadius: 16, boxShadow: "6px 6px 12px #c8c8c8,-6px -6px 12px #fff" }} />
                <Bar dataKey="accuracy" fill="#4a86ff" radius={[8, 8, 0, 0]} />
                <Bar dataKey="uptime" fill="#5ec48a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SoftCard>
      </div>
    </>
  );
}
