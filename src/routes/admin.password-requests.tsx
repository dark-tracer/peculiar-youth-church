import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  listResetRequests,
  setUserPassword,
  dismissResetRequest,
} from "@/lib/password-reset.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/password-requests")({
  ssr: false,
  component: PasswordRequests,
});

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function PasswordRequests() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listResetRequests);
  const setPwd = useServerFn(setUserPassword);
  const dismiss = useServerFn(dismissResetRequest);

  const [openId, setOpenId] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-password-requests"],
    queryFn: () => fetchList(),
    refetchInterval: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: (v: { requestId: string; email: string; password: string }) =>
      setPwd({ data: v }),
    onSuccess: () => {
      toast.success("Password set. The user must choose a new one at next sign-in.");
      setOpenId(null);
      setPassword("");
      qc.invalidateQueries({ queryKey: ["admin-password-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-password-requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to set password"),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismiss({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-password-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-password-requests"] });
    },
  });

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-bold mb-1">Password Requests</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Console users who asked for help signing back in. Set a temporary password and share it
        with them — they will be required to choose their own on the next sign-in.
      </p>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No password requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{r.full_name ?? r.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.email} · {r.role ?? "no role"} ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      r.status === "pending"
                        ? "bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setOpenId(openId === r.id ? null : r.id);
                          setPassword(randomPassword());
                        }}
                      >
                        <KeyRound className="h-4 w-4" /> Set password
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissMutation.mutate(r.id)}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {openId === r.id && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label htmlFor={`pw-${r.id}`}>Temporary password</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`pw-${r.id}`}
                        value={password}
                        minLength={8}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(password);
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setPassword(randomPassword())}>
                        Regenerate
                      </Button>
                    </div>
                  </div>
                  <Button
                    disabled={saveMutation.isPending || password.length < 8}
                    onClick={() =>
                      saveMutation.mutate({ requestId: r.id, email: r.email, password })
                    }
                  >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save &amp; mark resolved
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
