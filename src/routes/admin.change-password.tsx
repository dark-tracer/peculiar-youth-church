import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/change-password")({
  ssr: false,
  component: ForceChangePassword,
});

function ForceChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPassword !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("id", u.user.id);
      }
      toast.success("Password set. Welcome!");
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
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
          <h1 className="font-display text-2xl font-bold">Set a new password</h1>
          <p className="text-sm text-[oklch(0.70_0.02_250)] mt-1">
            For security, please set your own password before continuing.
          </p>
        </div>
        <form onSubmit={onSubmit}
          className="rounded-2xl border border-[oklch(0.30_0.03_260/60%)] bg-[oklch(0.21_0.03_260)] p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np">New password</Label>
            <Input id="np" type="password" required minLength={8} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[oklch(0.16_0.02_260)] border-[oklch(0.30_0.03_260/60%)]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp">Confirm password</Label>
            <Input id="cp" type="password" required minLength={8} value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-[oklch(0.16_0.02_260)] border-[oklch(0.30_0.03_260/60%)]" />
          </div>
          <Button type="submit" disabled={busy}
            className="w-full bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save password &amp; continue
          </Button>
        </form>
      </div>
    </div>
  );
}
