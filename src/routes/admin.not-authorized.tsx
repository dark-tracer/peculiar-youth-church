import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/not-authorized")({
  ssr: false,
  component: NotAuthorized,
});

function NotAuthorized() {
  return (
    <AdminShell>
      <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-10 text-center">
        <div className="mx-auto h-12 w-12 grid place-items-center rounded-xl bg-[oklch(0.28_0.06_35)] text-[oklch(0.68_0.20_40)] mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-display font-bold">Not Authorized</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You do not have permission to access this section. Editor accounts can manage Blog
          Posts, Articles, and Digital Artworks only.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] px-4 py-2 text-sm font-semibold hover:bg-[oklch(0.72_0.20_40)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
