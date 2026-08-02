import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OAuthDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center bg-background px-6">
      <div className="soft-raised rounded-[36px] p-10 max-w-md w-full text-center text-sm text-muted-foreground">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen w-full grid place-items-center bg-background px-6">
      <div className="soft-raised rounded-[36px] p-10 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="soft-pressed-sm h-14 w-14 rounded-2xl grid place-items-center text-brand-blue mb-5">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            LitterCam AI
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Connect {clientName}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {clientName} will be able to read your cameras, detections and violations, and record
            officer review decisions as you.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="soft-pressed-sm rounded-2xl mt-6 px-4 py-3 text-xs text-brand-red font-semibold text-center"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-8">
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="soft-raised-sm soft-press rounded-[20px] py-3 font-semibold text-muted-foreground disabled:opacity-50"
          >
            Deny
          </button>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="soft-raised-sm soft-press rounded-[20px] py-3 font-semibold text-brand-blue disabled:opacity-50"
          >
            {busy ? "Working…" : "Approve"}
          </button>
        </div>
      </div>
    </main>
  );
}
