import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { BibleStudyForm } from "@/components/admin/BibleStudyForm";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/bible-studies/$id")({
  ssr: false,
  component: EditStudy,
});

function EditStudy() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-studies", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("bible_studies").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell>
      <Link to="/admin/bible-studies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to studies
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">Edit Bible Study</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !data && <p className="text-muted-foreground">Study not found.</p>}
      {data && (
        <BibleStudyForm
          initial={{
            id: data.id,
            title: data.title,
            series_name: data.series_name ?? "",
            study_number: data.study_number != null ? String(data.study_number) : "",
            leader_name: data.leader_name ?? "",
            scripture: data.scripture ?? "",
            objective: data.objective ?? "",
            body: data.body ?? "",
            discussion_questions: data.discussion_questions ?? [],
            key_takeaway: data.key_takeaway ?? "",
            pdf_url: data.pdf_url ?? "",
            resource_url: data.resource_url ?? "",
            audience: data.audience ?? "",
            status: data.status === "scheduled" ? "draft" : (data.status as "draft" | "published"),
          }}
        />
      )}
    </AdminShell>
  );
}
