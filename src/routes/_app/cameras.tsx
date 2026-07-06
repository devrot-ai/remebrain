import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { CameraFeedCard } from "@/components/CameraFeedCard";
import { cameras } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/cameras")({
  head: () => ({
    meta: [
      { title: "Live Cameras — LitterCam AI" },
      { name: "description", content: "Live surveillance feeds with real-time AI overlays." },
    ],
  }),
  component: CamerasPage,
});

function CamerasPage() {
  return (
    <>
      <TopBar title="Live cameras" subtitle="Real-time feeds with AI bounding-box overlays" />
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {cameras.map((c, i) => (
          <CameraFeedCard key={c.id} camera={c} seed={i + 1} />
        ))}
      </div>
    </>
  );
}
