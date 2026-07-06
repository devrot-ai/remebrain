import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { AiInsightsPanel } from "@/components/layout/AiInsightsPanel";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
      <AiInsightsPanel />
    </div>
  );
}
