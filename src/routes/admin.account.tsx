import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/admin/FormField";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/account")({
  ssr: false,
  component: AccountPage,
});

function AccountPage() {
  const { email, fullName, role } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPassword !== confirm) return toast.error("Passwords do not match");
    if (!email) return toast.error("Missing account email");

    setBusy(true);
    try {
      // Verify current password by re-signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInErr) {
        toast.error("Current password is incorrect");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Clear first-login flag if present
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("id", u.user.id);
      }

      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">My Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Signed in as {fullName ?? email} ({role})
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4 max-w-lg rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change password</h2>
        <Field label="Current password">
          <Input type="password" autoComplete="current-password" value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)} required minLength={8} />
        </Field>
        <Field label="New password">
          <Input type="password" autoComplete="new-password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
        </Field>
        <Button type="submit" disabled={busy}
          className="bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Update password
        </Button>
      </form>
    </AdminShell>
  );
}
