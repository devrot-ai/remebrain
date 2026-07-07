import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LitterCam AI" },
      { name: "description", content: "Officer sign-in for LitterCam AI command center." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signInGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
  };

  return (
    <div className="min-h-screen w-full grid place-items-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="soft-raised rounded-[36px] p-10 max-w-md w-full"
      >
        <div className="flex flex-col items-center text-center">
          <div className="soft-pressed-sm h-14 w-14 rounded-2xl grid place-items-center text-brand-blue mb-5">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            LitterCam AI
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Officer command sign-in
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Every violation is reviewed by an authorized officer. Sign in to access the
            command center.
          </p>
        </div>

        <button
          onClick={signInGoogle}
          disabled={loading}
          className="soft-raised-sm soft-press rounded-[20px] w-full mt-8 py-3.5 font-semibold text-foreground inline-flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <GoogleMark />
          {loading ? "Redirecting…" : "Continue with Google"}
        </button>

        {error && (
          <div className="soft-pressed-sm rounded-2xl mt-4 px-4 py-3 text-xs text-brand-red font-semibold text-center">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground justify-center font-semibold">
          <LogIn className="h-3 w-3" />
          Secured by Lovable Cloud
        </div>
      </motion.div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l5.9-5.7C34.4 3.3 29.7 1.5 24 1.5 14.8 1.5 7 6.8 3.4 14.4l6.9 5.4C12 14 17.5 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3-.4-4.5H24v9h12.7c-.5 2.9-2.2 5.3-4.7 6.9l7.2 5.6c4.2-3.9 6.8-9.6 6.8-17z" />
      <path fill="#FBBC05" d="M10.3 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-6.9-5.4C1.8 17.1.5 20.4.5 24s1.3 6.9 3.4 10l6.4-5.4z" />
      <path fill="#34A853" d="M24 46.5c6.5 0 11.9-2.1 15.8-5.8l-7.2-5.6c-2 1.4-4.6 2.3-8.6 2.3-6.5 0-12-4.5-13.7-10.5l-6.4 5.4C7 41.2 14.8 46.5 24 46.5z" />
    </svg>
  );
}
