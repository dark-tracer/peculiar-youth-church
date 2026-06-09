import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { Construction, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/$section")({
  ssr: false,
  component: ComingSoon,
});

const labels: Record<string, string> = {
  "bible-studies": "Bible Studies",
  artworks: "Digital Artworks",
  media: "Media Library",
  team: "Team Members",
  settings: "Settings",
};

function ComingSoon() {
  const { section } = Route.useParams();
  const label = labels[section] ?? section;
  return (
    <AdminShell>
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="inline-grid h-14 w-14 place-items-center rounded-xl bg-[oklch(0.68_0.20_40/15%)] text-[oklch(0.68_0.20_40)] mb-4">
          <Construction className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-display font-bold">{label}</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          This section will be built in the next phase. The database is already set up, so your content will be ready to manage as soon as the admin UI ships.
        </p>
      </div>
    </AdminShell>
  );
}
