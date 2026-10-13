import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { SoftInput } from "@/components/soft/SoftInput";
import { addPlateExample, deletePlateExample, listPlateExamples } from "@/lib/plates.functions";

export const Route = createFileRoute("/_app/plates")({
  head: () => ({
    meta: [
      { title: "Plate Training — LitterCam AI" },
      { name: "description", content: "Teach the AI your local license plates with officer corrections." },
    ],
  }),
  component: PlatesPage,
});

function PlatesPage() {
  const list = useServerFn(listPlateExamples);
  const add = useServerFn(addPlateExample);
  const del = useServerFn(deletePlateExample);
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ["plate-examples"], queryFn: () => list() });
  const [aiPlate, setAiPlate] = useState("");
  const [correct, setCorrect] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["plate-examples"] });

  const submit = async () => {
    if (!correct.trim()) return toast.error("Enter the correct plate");
    try {
      await add({ data: { ai_plate: aiPlate, correct_plate: correct } });
      setAiPlate("");
      setCorrect("");
      toast.success("Plate added — the AI will use it from the next frame");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <>
      <TopBar title="Plate training" subtitle="The AI sees your 20 newest corrections on every frame it reads" />
      <SoftCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="h-4 w-4 text-brand-blue" />
          <h2 className="font-bold">Add a correction</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <SoftInput value={aiPlate} onChange={(e) => setAiPlate(e.target.value)} placeholder="What the AI read (optional)" />
          <SoftInput value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="Correct plate" onKeyDown={(e) => e.key === "Enter" && void submit()} />
          <SoftButton variant="primary" onClick={submit} icon={<Plus className="h-4 w-4" />}>Add</SoftButton>
        </div>
      </SoftCard>

      <SoftCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Learned plates</h2>
          <SoftBadge tone="blue">{rows.length}</SoftBadge>
        </div>
        {rows.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No corrections yet. Add one above, or fix a plate while approving a violation.</div>}
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={r.id} className="soft-pressed-sm rounded-2xl p-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground line-through w-28 truncate">{r.ai_plate || "—"}</span>
              <span className="font-black tabular-nums tracking-wider flex-1">{r.correct_plate}</span>
              {i < 20 && <SoftBadge tone="green">In use</SoftBadge>}
              <SoftBadge tone={r.violation_id ? "gold" : "blue"}>{r.violation_id ? "From review" : "Manual"}</SoftBadge>
              <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              <button aria-label="Delete" onClick={async () => { await del({ data: { id: r.id } }); refresh(); }} className="soft-raised-sm soft-press rounded-xl p-2">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </SoftCard>
    </>
  );
}
