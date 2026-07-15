import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchPageContent, savePageContent, type PageKey, type PageData } from "@/lib/page-content";
import { uploadFile } from "@/lib/admin-storage";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/admin/pages")({
  ssr: false,
  component: () => (
    <AdminGate>
      <PagesEditor />
    </AdminGate>
  ),
});

type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image";
  placeholder?: string;
};

type Section = {
  key: PageKey;
  title: string;
  fields: Field[];
};

const SECTIONS: Record<"home" | "about" | "contact", Section[]> = {
  home: [
    {
      key: "home_hero",
      title: "Hero",
      fields: [
        { key: "eyebrow", label: "Eyebrow (small badge above title)" },
        { key: "title_lead", label: "Title (leading text)" },
        { key: "title_highlight", label: "Title (highlighted text)" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "primary_cta_label", label: "Primary button label" },
        { key: "primary_cta_href", label: "Primary button link" },
        { key: "secondary_cta_label", label: "Secondary button label" },
        { key: "secondary_cta_href", label: "Secondary button link" },
        { key: "background_image_url_1", label: "Background image 1 (slideshow)", type: "image" },
        { key: "background_image_url_2", label: "Background image 2", type: "image" },
        { key: "background_image_url_3", label: "Background image 3", type: "image" },
        { key: "background_image_url_4", label: "Background image 4", type: "image" },
        { key: "background_image_url_5", label: "Background image 5", type: "image" },
        { key: "background_image_url_6", label: "Background image 6", type: "image" },
        { key: "background_image_url_7", label: "Background image 7", type: "image" },
      ],
    },
    {
      key: "home_about",
      title: "About blurb",
      fields: [
        { key: "eyebrow", label: "Eyebrow" },
        { key: "title", label: "Title" },
        { key: "body", label: "Body", type: "textarea" },
      ],
    },
    {
      key: "home_service_times",
      title: "Service times",
      fields: [
        { key: "title", label: "Section title" },
        { key: "sunday_service", label: "Sunday Service" },
        { key: "bible_study", label: "Bible Study" },
        { key: "worship_sunday", label: "Worship Sunday" },
      ],
    },
    {
      key: "home_verse",
      title: "Verse of the day",
      fields: [
        { key: "reference", label: "Scripture reference (e.g. John 3:16)" },
        { key: "text", label: "Verse text", type: "textarea" },
      ],
    },
    {
      key: "home_mission",
      title: "Mission banner",
      fields: [{ key: "text", label: "Mission statement", type: "textarea" }],
    },
  ],
  about: [
    {
      key: "about_page",
      title: "About page",
      fields: [
        { key: "hero_eyebrow", label: "Hero eyebrow" },
        { key: "hero_title", label: "Hero title" },
        { key: "hero_subtitle", label: "Hero subtitle", type: "textarea" },
        { key: "who_title", label: "'Who we are' title" },
        { key: "who_body_1", label: "Body paragraph 1", type: "textarea" },
        { key: "who_body_2", label: "Body paragraph 2", type: "textarea" },
        { key: "who_image_url", label: "'Who we are' image", type: "image" },
      ],
    },
  ],
  contact: [
    {
      key: "contact_page",
      title: "Contact page",
      fields: [
        { key: "hero_title", label: "Hero title" },
        { key: "hero_subtitle", label: "Hero subtitle", type: "textarea" },
        { key: "address", label: "Address", type: "textarea" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "service_times", label: "Service times", type: "textarea" },
      ],
    },
  ],
};

function PagesEditor() {
  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">Site Content</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edit text and images on the Home, About, and Contact pages. Changes are live immediately.
        </p>
      </header>

      <Tabs defaultValue="home">
        <TabsList className="mb-6">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {(Object.keys(SECTIONS) as Array<keyof typeof SECTIONS>).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            {SECTIONS[tab].map((section) => (
              <SectionEditor key={section.key} section={section} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </AdminShell>
  );
}

function SectionEditor({ section }: { section: Section }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: initial, isLoading } = useQuery({
    queryKey: ["page_content", section.key],
    queryFn: () => fetchPageContent(section.key),
  });
  const [values, setValues] = useState<PageData>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) setValues(initial);
  }, [initial]);

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await savePageContent(section.key, values, user.id);
      await qc.invalidateQueries({ queryKey: ["page_content", section.key] });
      toast.success(`${section.title} saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h2 className="text-xl font-semibold">{section.title}</h2>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        section.fields.map((f) => (
          <FieldRow
            key={f.key}
            field={f}
            value={values[f.key] ?? ""}
            onChange={(v) => set(f.key, v)}
          />
        ))
      )}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={busy}
          className="bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] hover:bg-[oklch(0.72_0.20_40)]"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save {section.title}
        </Button>
      </div>
    </form>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFile("post-covers", file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (field.type === "image") {
    return (
      <div className="space-y-2">
        <Label className="text-sm">{field.label}</Label>
        {value ? (
          <div className="space-y-2">
            <img
              src={value}
              alt=""
              className="w-full max-w-md aspect-video object-cover rounded-md border border-border"
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer max-w-md">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Click to upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        )}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{field.label}</Label>
        <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{field.label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
    </div>
  );
}
