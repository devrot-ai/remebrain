import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Camera as CameraIcon, Trash2, MapPin, Activity } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftInput } from "@/components/soft/SoftInput";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { listCameras, createCamera, deleteCamera } from "@/lib/cameras.functions";

export const Route = createFileRoute("/_app/cameras")({
  head: () => ({
    meta: [
      { title: "Cameras — LitterCam AI" },
      { name: "description", content: "Manage cameras and run live litter detection on each feed." },
    ],
  }),
  component: CamerasPage,
});

function CamerasPage() {
  const list = useServerFn(listCameras);
  const create = useServerFn(createCamera);
  const remove = useServerFn(deleteCamera);
  const qc = useQueryClient();
  const router = useRouter();

  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => list(),
  });

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const createMut = useMutation({
    mutationFn: () => create({ data: { name: name.trim(), location: location.trim() || null } }),
    onSuccess: () => {
      toast.success("Camera added");
      setName("");
      setLocation("");
      qc.invalidateQueries({ queryKey: ["cameras"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Camera removed");
      qc.invalidateQueries({ queryKey: ["cameras"] });
    },
  });

  return (
    <>
      <TopBar title="Cameras" subtitle="Register cameras and stream frames for AI analysis" />

      <SoftCard className="mb-6">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
          Add new camera
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMut.mutate();
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <SoftInput
            placeholder="Name (e.g. Front gate)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <SoftInput
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <SoftButton
            variant="primary"
            type="submit"
            disabled={createMut.isPending || !name.trim()}
            icon={<Plus className="h-4 w-4" />}
          >
            {createMut.isPending ? "Adding…" : "Add camera"}
          </SoftButton>
        </form>
      </SoftCard>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : cameras.length === 0 ? (
        <SoftCard>
          <div className="text-center py-8">
            <CameraIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <div className="font-bold mb-1">No cameras yet</div>
            <div className="text-sm text-muted-foreground">
              Add your first camera above to start capturing frames.
            </div>
          </div>
        </SoftCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cameras.map((c) => (
            <SoftCard key={c.id} className="!p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="soft-pressed-sm h-9 w-9 rounded-xl grid place-items-center text-brand-blue">
                  <CameraIcon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <SoftBadge tone={c.active ? "green" : "red"}>
                  <Activity className="h-3 w-3" />
                  {c.active ? "active" : "off"}
                </SoftBadge>
              </div>
              <div className="font-bold truncate">{c.name}</div>
              {c.location && (
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {c.location}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Link
                  to="/cameras/$id"
                  params={{ id: c.id }}
                  className="soft-raised-sm soft-press rounded-xl px-3 py-2 text-xs font-bold text-brand-blue flex-1 text-center"
                >
                  Open live view
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${c.name}?`)) deleteMut.mutate(c.id);
                  }}
                  className="soft-raised-sm soft-press rounded-xl px-3 py-2 text-xs text-brand-red"
                  aria-label="Delete camera"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </SoftCard>
          ))}
        </div>
      )}
    </>
  );
}
