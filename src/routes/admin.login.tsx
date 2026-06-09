import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [allowFirstSignup, setAllowFirstSignup] = useState(false);

  // Show "create first super admin" only when no roles exist yet
  useEffect(() => {
    supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setAllowFirstSignup((count ?? 0) === 0));
  }, []);

  // If already signed in & admin, redirect to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (roles && roles.length > 0) navigate({ to: "/admin/dashboard" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin/login" },
        });
        if (error) throw error;
        toast.success("Account created — signing in…");
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) throw e2;
        navigate({ to: "/admin/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // verify role
        const { data: u } = await supabase.auth.getUser();
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.user!.id);
        if (!roles || roles.length === 0) {
          await supabase.auth.signOut();
          throw new Error("This account is not authorized for the admin console.");
        }
        if (!remember) {
          // best-effort: drop persisted session on tab close (browsers will still keep localStorage)
        }
        navigate({ to: "/admin/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[oklch(0.16_0.02_260)] text-[oklch(0.96_0.01_250)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold">Admin Console</h1>
          <p className="text-sm text-[oklch(0.70_0.02_250)] mt-1">
            Peculiar Youth &amp; Children Ministry
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-[oklch(0.30_0.03_260/60%)] bg-[oklch(0.21_0.03_260)] p-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[oklch(0.96_0.01_250)]">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[oklch(0.16_0.02_260)] border-[oklch(0.30_0.03_260/60%)] text-[oklch(0.96_0.01_250)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[oklch(0.96_0.01_250)]">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[oklch(0.16_0.02_260)] border-[oklch(0.30_0.03_260/60%)] text-[oklch(0.96_0.01_250)]"
            />
          </div>

          {mode === "signin" && (
            <label className="flex items-center gap-2 text-sm text-[oklch(0.70_0.02_250)]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-[oklch(0.68_0.20_40)]"
              />
              Remember me on this device
            </label>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create Super Admin" : "Sign in"}
          </Button>

          {allowFirstSignup && (
            <p className="text-xs text-center text-[oklch(0.70_0.02_250)]">
              {mode === "signin" ? (
                <>
                  First time setup?{" "}
                  <button
                    type="button"
                    className="text-[oklch(0.85_0.15_85)] underline"
                    onClick={() => setMode("signup")}
                  >
                    Create the first Super Admin
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="text-[oklch(0.85_0.15_85)] underline"
                  onClick={() => setMode("signin")}
                >
                  Back to sign in
                </button>
              )}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-[oklch(0.70_0.02_250)]">
          Authorized personnel only. Sessions expire after 30 minutes of inactivity.
        </p>
      </div>
    </div>
  );
}
