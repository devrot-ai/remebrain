import { Bell, Search } from "lucide-react";
import { SoftInput } from "@/components/soft/SoftInput";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 mb-6">
      <div className="min-w-0 pl-14 lg:pl-0">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          LitterCam AI
        </div>
        <h1 className="truncate text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:block w-56">
          <SoftInput placeholder="Search plates, cameras…" />
        </div>
        <button
          aria-label="Search"
          className="soft-raised-sm soft-press rounded-2xl h-11 w-11 grid place-items-center md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          aria-label="Notifications"
          className="soft-raised-sm soft-press rounded-2xl h-11 w-11 grid place-items-center relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-red" />
        </button>
        <div className="soft-raised-sm rounded-2xl h-11 pl-2 pr-4 flex items-center gap-2">
          <div className="soft-pressed-sm h-8 w-8 rounded-full grid place-items-center text-xs font-black text-brand-blue">
            OM
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-bold">Officer Mora</div>
            <div className="text-[10px] text-muted-foreground">Traffic Unit</div>
          </div>
        </div>
      </div>
    </header>
  );
}
