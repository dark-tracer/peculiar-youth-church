import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { SermonForm } from "@/components/admin/SermonForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/sermons/new")({
  ssr: false,
  component: NewSermon,
});

function NewSermon() {
  return (
    <AdminShell>
      <Link to="/admin/sermons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to sermons
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">New Sermon</h1>
      <SermonForm />
    </AdminShell>
  );
}
