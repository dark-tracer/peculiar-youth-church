import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Mic2, FileText, Newspaper, BookOpen, Palette, Plus, CircleCheck, CircleDashed } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  component: DashboardPage,
});

async function fetchStats() {
  const tables = ["sermons", "blog_posts", "articles", "bible_studies", "artworks"] as const;
  const results = await Promise.all(
    tables.map(async (t) => {
      const [{ count: total }, { count: published }] = await Promise.all([
        supabase.from(t).select("id", { count: "exact", head: true }),
        supabase.from(t).select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);
      return { table: t, total: total ?? 0, published: published ?? 0 };
    }),
  );
  return results;
}

async function fetchRecent() {
  const { data } = await supabase
    .from("sermons")
    .select("id, title, status, created_at, slug")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

const tableMeta = {
  sermons: { label: "Sermons", icon: Mic2, href: "/admin/sermons" },
  blog_posts: { label: "Blog Posts", icon: FileText, href: "/admin/blog" },
  articles: { label: "Articles", icon: Newspaper, href: "/admin/articles" },
  bible_studies: { label: "Bible Studies", icon: BookOpen, href: "/admin/bible-studies" },
  artworks: { label: "Artworks", icon: Palette, href: "/admin/artworks" },
} as const;

function DashboardPage() {
  const { fullName, user, role } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchStats });
  const { data: recent } = useQuery({ queryKey: ["admin-recent"], queryFn: fetchRecent });

  const totalPublished = stats?.reduce((s, x) => s + x.published, 0) ?? 0;
  const totalDrafts = (stats?.reduce((s, x) => s + x.total, 0) ?? 0) - totalPublished;

  return (
    <AdminShell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </div>
        <h1 className="mt-1 text-3xl font-display font-bold">
          Welcome back, {fullName ?? user?.email?.split("@")[0] ?? "Admin"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {role === "super_admin"
            ? "Super Admin — you have full control over all content."
            : "Editor — you can create and edit drafts."}
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats?.map((s) => {
          const meta = tableMeta[s.table];
          return (
            <Link
              key={s.table}
              to={meta.href}
              className="rounded-xl border border-border bg-card p-4 hover:border-[oklch(0.68_0.20_40/60%)] transition"
            >
              <div className="flex items-center justify-between">
                <meta.icon className="h-4 w-4 text-[oklch(0.68_0.20_40)]" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.published} live
                </span>
              </div>
              <div className="mt-3 text-3xl font-display font-bold">{s.total}</div>
              <div className="text-xs text-muted-foreground mt-1">{meta.label}</div>
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Published</div>
          <div className="mt-2 text-2xl font-display font-bold text-[oklch(0.78_0.15_150)]">{totalPublished}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Drafts</div>
          <div className="mt-2 text-2xl font-display font-bold text-[oklch(0.85_0.15_85)]">{totalDrafts}</div>
        </div>
        <Link to="/admin/review" className="rounded-xl border border-border bg-card p-4 hover:border-[oklch(0.68_0.20_40/60%)] transition">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Pending review</div>
          <div className="mt-2 text-2xl font-display font-bold text-[oklch(0.68_0.20_40)]">{totalDrafts}</div>
        </Link>
      </section>

      {/* Quick upload */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick upload</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/sermons/new"
            className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-4 py-2 text-sm font-semibold hover:bg-[oklch(0.72_0.20_40)]"
          >
            <Plus className="h-4 w-4" /> New Sermon
          </Link>
          {(["blog", "articles", "bible-studies", "artworks"] as const).map((s) => (
            <Link
              key={s}
              to={`/admin/${s}`}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted opacity-60"
            >
              <Plus className="h-4 w-4" /> {s.replace("-", " ")}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent sermons</h2>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {recent && recent.length > 0 ? (
            recent.map((r) => (
              <Link
                key={r.id}
                to="/admin/sermons/$id"
                params={{ id: r.id }}
                className="flex items-center justify-between gap-3 p-4 hover:bg-muted transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {r.status === "published" ? (
                    <CircleCheck className="h-4 w-4 text-[oklch(0.78_0.15_150)] shrink-0" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-[oklch(0.85_0.15_85)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                  {r.status}
                </span>
              </Link>
            ))
          ) : (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No content yet. Start by adding a sermon.
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
