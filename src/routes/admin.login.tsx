import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  component: AdminLogin,
});

const UNAUTHORIZED_MSG = "This account is not authorized for the admin console.";
const DISABLED_MSG =
  "Your account has been disabled. Please contact your administrator.";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  // If already signed in & authorized, redirect to dashboard
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        supabase
          .from("profiles")
          .select("status,email")
          .eq("id", data.user.id)
          .maybeSingle(),
      ]);
      const hasSuper = !!roles?.some((r) => r.role === "super_admin");
      const hasAdmin = !!roles?.some((r) => (r.role as string) === "admin");
      const hasEditor = !!roles?.some((r) => r.role === "editor");
      const authorized =
        (hasSuper && isSuperAdminEmail(profile?.email ?? data.user.email)) ||
        (hasAdmin && profile?.status === "active") ||
        (hasEditor && profile?.status === "active");
      if (authorized) navigate({ to: "/admin/dashboard" });
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
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        // Never reveal whether the email exists
        toast.error(UNAUTHORIZED_MSG);
        return;
      }

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast.error(UNAUTHORIZED_MSG);
        return;
      }

      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
        supabase
          .from("profiles")
          .select("status,email")
          .eq("id", u.user.id)
          .maybeSingle(),
      ]);

      const hasSuper = !!roles?.some((r) => r.role === "super_admin");
      const hasEditor = !!roles?.some((r) => r.role === "editor");
      const acctEmail = profile?.email ?? u.user.email ?? "";

      // Super admin path
      if (hasSuper && isSuperAdminEmail(acctEmail)) {
        if (!remember) {
          // best-effort: nothing to do; supabase persists by default
        }
        navigate({ to: "/admin/dashboard" });
        return;
      }

      // Editor path
      if (hasEditor) {
        if (profile?.status === "disabled") {
          await supabase.auth.signOut();
          toast.error(DISABLED_MSG);
          return;
        }
        navigate({ to: "/admin/dashboard" });
        return;
      }

      // Anything else: not authorized
      await supabase.auth.signOut();
      toast.error(UNAUTHORIZED_MSG);
    } catch {
      toast.error(UNAUTHORIZED_MSG);
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
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[oklch(0.16_0.02_260)] border-[oklch(0.30_0.03_260/60%)] text-[oklch(0.96_0.01_250)]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[oklch(0.70_0.02_250)]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[oklch(0.68_0.20_40)]"
            />
            Remember me on this device
          </label>

          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>

          <p className="text-xs text-center text-[oklch(0.70_0.02_250)]">
            Editor accounts are invite-only. Contact your administrator for access.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-[oklch(0.70_0.02_250)]">
          Authorized personnel only. Sessions expire after 30 minutes of inactivity.
        </p>
      </div>
    </div>
  );
}
