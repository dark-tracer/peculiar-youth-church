import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { BibleStudyForm } from "@/components/admin/BibleStudyForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/bible-studies/new")({
  ssr: false,
  component: NewStudy,
});

function NewStudy() {
  return (
    <AdminShell>
      <Link to="/admin/bible-studies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to studies
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">New Bible Study</h1>
      <BibleStudyForm />
    </AdminShell>
  );
}
