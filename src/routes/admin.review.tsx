import { SuperAdminGate } from "@/components/admin/SuperAdminGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Mic2, FileText, Newspaper, BookOpen, Palette, CheckCircle2, Edit, Inbox } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/review")({
  ssr: false,
  component: () => (<SuperAdminGate><ReviewQueue /></SuperAdminGate>),
});

type Kind = "sermons" | "blog_posts" | "articles" | "bible_studies" | "artworks";

const meta: Record<Kind, { label: string; icon: typeof Mic2; editPath: (id: string) => string }> = {
  sermons:       { label: "Sermon",       icon: Mic2,      editPath: (id) => `/admin/sermons/${id}` },
  blog_posts:    { label: "Blog Post",    icon: FileText,  editPath: (id) => `/admin/blog/${id}` },
  articles:      { label: "Article",      icon: Newspaper, editPath: (id) => `/admin/articles/${id}` },
  bible_studies: { label: "Bible Study",  icon: BookOpen,  editPath: (id) => `/admin/bible-studies/${id}` },
  artworks:      { label: "Artwork",      icon: Palette,   editPath: (id) => `/admin/artworks/${id}` },
};

async function fetchPending() {
  const kinds: Kind[] = ["sermons", "blog_posts", "articles", "bible_studies", "artworks"];
  const results = await Promise.all(
    kinds.map(async (k) => {
      const { data } = await supabase
        .from(k)
        .select("id, title, created_at")
        .eq("status", "draft")
        .order("created_at", { ascending: false });
      return { kind: k, items: data ?? [] };
    }),
  );
  return results;
}

function ReviewQueue() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-review"], queryFn: fetchPending });

  async function publish(kind: Kind, id: string) {
    const { error } = await supabase.from(kind).update({ status: "published" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Published");
    qc.invalidateQueries({ queryKey: ["admin-review"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
    qc.invalidateQueries({ queryKey: [`admin-${kind}`] });
  }

  const total = data?.reduce((s, g) => s + g.items.length, 0) ?? 0;

  return (
    <AdminShell>
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold">Pending Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drafts waiting to be approved. {role === "super_admin" ? "Click Publish to push them live." : "Only Super Admins can publish."}
        </p>
      </header>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && total === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Inbox className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-base font-semibold">All clear</p>
          <p className="text-sm text-muted-foreground">No drafts are waiting for review.</p>
        </div>
      )}

      <div className="space-y-6">
        {data?.map((g) => {
          if (g.items.length === 0) return null;
          const m = meta[g.kind];
          return (
            <section key={g.kind} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <m.icon className="h-4 w-4 text-[oklch(0.68_0.20_40)]" />
                <h2 className="font-semibold">{m.label}</h2>
                <span className="ml-auto text-xs text-muted-foreground">{g.items.length} pending</span>
              </div>
              <ul className="divide-y divide-border">
                {g.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{it.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(it.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Link to={m.editPath(it.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs hover:bg-muted/70">
                      <Edit className="h-3 w-3" /> Review
                    </Link>
                    {role === "super_admin" && (
                      <button onClick={() => publish(g.kind, it.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[oklch(0.72_0.20_40)]">
                        <CheckCircle2 className="h-3 w-3" /> Publish
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </AdminShell>
  );
}
