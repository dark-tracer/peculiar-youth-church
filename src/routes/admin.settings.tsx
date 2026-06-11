import { SuperAdminGate } from "@/components/admin/SuperAdminGate";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/admin/FormField";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  component: () => (<SuperAdminGate><SettingsAdmin /></SuperAdminGate>),
});

interface Settings {
  site_title: string;
  tagline: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  tiktok_url: string;
  twitter_url: string;
  giving_note: string;
}

const empty: Settings = {
  site_title: "", tagline: "", contact_email: "", contact_phone: "", address: "",
  instagram_url: "", facebook_url: "", youtube_url: "", tiktok_url: "", twitter_url: "", giving_note: "",
};

function SettingsAdmin() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [v, setV] = useState<Settings>(empty);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setV({
        site_title: data.site_title ?? "",
        tagline: data.tagline ?? "",
        contact_email: data.contact_email ?? "",
        contact_phone: data.contact_phone ?? "",
        address: data.address ?? "",
        instagram_url: data.instagram_url ?? "",
        facebook_url: data.facebook_url ?? "",
        youtube_url: data.youtube_url ?? "",
        tiktok_url: data.tiktok_url ?? "",
        twitter_url: data.twitter_url ?? "",
        giving_note: data.giving_note ?? "",
      });
    }
  }, [data]);

  const set = <K extends keyof Settings>(k: K, val: Settings[K]) => setV((p) => ({ ...p, [k]: val }));
  const disabled = role !== "super_admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return toast.error("Only Super Admins can change site settings.");
    if (!v.site_title.trim()) return toast.error("Site title is required");
    setBusy(true);
    try {
      const payload = {
        ...v,
        tagline: v.tagline || null,
        contact_email: v.contact_email || null,
        contact_phone: v.contact_phone || null,
        address: v.address || null,
        instagram_url: v.instagram_url || null,
        facebook_url: v.facebook_url || null,
        youtube_url: v.youtube_url || null,
        tiktok_url: v.tiktok_url || null,
        twitter_url: v.twitter_url || null,
        giving_note: v.giving_note || null,
      };
      const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
      if (error) throw error;
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }


  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">Site Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Ministry-wide configuration used across the public site.</p>
        {disabled && (
          <p className="mt-3 inline-block rounded-md bg-[oklch(0.30_0.05_85)] text-[oklch(0.85_0.15_85)] px-3 py-1 text-xs">
            Read-only — only Super Admins can edit settings.
          </p>
        )}
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Identity</h2>
            <Field label="Site title">
              <Input disabled={disabled} value={v.site_title} onChange={(e) => set("site_title", e.target.value)} required />
            </Field>
            <Field label="Tagline">
              <Input disabled={disabled} value={v.tagline} onChange={(e) => set("tagline", e.target.value)}
                placeholder="Raising the next generation in faith and purpose." />
            </Field>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email">
                <Input disabled={disabled} type="email" value={v.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input disabled={disabled} value={v.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
              </Field>
            </div>
            <Field label="Address">
              <Textarea disabled={disabled} rows={2} value={v.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Social Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Instagram URL"><Input disabled={disabled} value={v.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/…" /></Field>
              <Field label="Facebook URL"><Input disabled={disabled} value={v.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/…" /></Field>
              <Field label="YouTube URL"><Input disabled={disabled} value={v.youtube_url} onChange={(e) => set("youtube_url", e.target.value)} placeholder="https://youtube.com/…" /></Field>
              <Field label="TikTok URL"><Input disabled={disabled} value={v.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@…" /></Field>
              <Field label="Twitter / X URL"><Input disabled={disabled} value={v.twitter_url} onChange={(e) => set("twitter_url", e.target.value)} placeholder="https://x.com/…" /></Field>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Giving</h2>
            <Field label="Note shown on the Give page">
              <Textarea disabled={disabled} rows={3} value={v.giving_note} onChange={(e) => set("giving_note", e.target.value)}
                placeholder="Thank you for sowing into the next generation." />
            </Field>
          </section>

          <Button type="submit" disabled={busy || disabled}
            className="bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </form>
      )}
    </AdminShell>
  );
}
