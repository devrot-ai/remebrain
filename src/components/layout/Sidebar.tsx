import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Video,
  Activity,
  ShieldAlert,
  UserCheck,
  BarChart3,
  Map,
  FileText,
  Settings,
  User,
  Moon,
  Sun,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SoftToggle } from "@/components/soft/SoftToggle";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cameras", label: "Live Cameras", icon: Video },
  { to: "/detections", label: "Detection Feed", icon: Activity },
  { to: "/violations", label: "Violations", icon: ShieldAlert },
  { to: "/review", label: "Human Review", icon: UserCheck },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/heatmap", label: "Heatmap", icon: Map },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
  };

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="soft-raised-sm rounded-2xl p-3 fixed top-4 left-4 z-40 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0",
          "p-6 flex flex-col gap-6 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="soft-raised rounded-[30px] p-4 flex items-center gap-3">
          <div className="soft-pressed-sm h-11 w-11 rounded-2xl grid place-items-center text-brand-blue font-black">
            LC
          </div>
          <div className="min-w-0">
            <div className="font-bold text-foreground truncate">LitterCam AI</div>
            <div className="text-[11px] text-muted-foreground truncate">
              Smart City Enforcement
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
          {items.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition-all duration-200",
                  active
                    ? "soft-raised text-brand-blue"
                    : "text-muted-foreground hover:text-foreground hover:-translate-y-0.5",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="soft-raised rounded-[30px] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Theme
            </span>
            <SoftToggle checked={dark} onChange={toggleDark} />
          </div>
          <button className="soft-press soft-raised-sm rounded-[20px] py-2.5 text-sm font-semibold text-brand-red inline-flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
