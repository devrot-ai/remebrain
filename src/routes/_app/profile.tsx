import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftInput } from "@/components/soft/SoftInput";
import { SoftButton } from "@/components/soft/SoftButton";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — LitterCam AI" },
      { name: "description", content: "Officer profile and review statistics." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <>
      <TopBar title="Officer profile" subtitle="Your credentials & review history" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SoftCard className="text-center">
          <div className="soft-pressed rounded-full h-28 w-28 mx-auto grid place-items-center text-3xl font-black text-brand-blue">
            OM
          </div>
          <div className="mt-4 font-bold text-lg">Officer Mora</div>
          <div className="text-xs text-muted-foreground">Traffic Enforcement Unit</div>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <SoftBadge tone="green">Lead reviewer</SoftBadge>
            <SoftBadge tone="blue">Badge #4820</SoftBadge>
          </div>
        </SoftCard>

        <SoftCard className="xl:col-span-2">
          <h2 className="font-bold text-lg mb-4">Account details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Full name</label>
              <SoftInput defaultValue="Alicia Mora" className="mt-1" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Email</label>
              <SoftInput defaultValue="a.mora@city.gov" className="mt-1" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Unit</label>
              <SoftInput defaultValue="Traffic Enforcement" className="mt-1" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Shift</label>
              <SoftInput defaultValue="Day · 07:00 – 15:00" className="mt-1" />
            </div>
          </div>
          <SoftButton variant="primary" className="mt-6">Save changes</SoftButton>
        </SoftCard>

        <SoftCard className="xl:col-span-3">
          <h2 className="font-bold text-lg mb-4">Review activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Approved", "1,284", "green"],
              ["Rejected", "42", "red"],
              ["False positive", "17", "blue"],
              ["Avg time / review", "38s", "gold"],
            ].map(([k, v, t]) => (
              <div key={k} className="soft-pressed rounded-[24px] p-5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                <div className={`text-2xl font-black mt-1 text-brand-${t}`}>{v}</div>
              </div>
            ))}
          </div>
        </SoftCard>
      </div>
    </>
  );
}
