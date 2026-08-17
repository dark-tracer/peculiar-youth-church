import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isApprovedConsoleEmail } from "@/lib/password-reset.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/forgot-password")({
  ssr: false,
  component: ForgotPassword,
});

const GENERIC =
  "If that email belongs to an approved console account, a password reset link is on its way.";

function ForgotPassword() {
  const checkApproved = useServerFn(isApprovedConsoleEmail);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { approved } = await checkApproved({ data: { email } });
      if (approved) {
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        });
      }
      setSent(true);
      toast.success(GENERIC);
    } catch {
      setSent(true);
      toast.success(GENERIC);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[oklch(0.16_0.02_260)] text-[oklch(0.96_0.01_250)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">Forgot your password?</h1>
          <p className="text-sm text-[oklch(0.70_0.02_250)] mt-1">
            Enter the email address linked to your console account.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-[oklch(0.30_0.03_260/60%)] bg-[oklch(0.21_0.03_260)] p-6 space-y-4 text-sm">
            <p>{GENERIC}</p>
            <Link to="/admin/login" className="text-[oklch(0.68_0.20_40)] underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-[oklch(0.30_0.03_260/60%)] bg-[oklch(0.21_0.03_260)] p-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="fp-email">Email</Label>
              <Input
                id="fp-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[oklch(0.16_0.02_260)] border-[oklch(0.30_0.03_260/60%)]"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
            <p className="text-xs text-center text-[oklch(0.70_0.02_250)]">
              <Link to="/admin/login" className="underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
