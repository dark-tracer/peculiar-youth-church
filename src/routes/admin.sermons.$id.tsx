import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { SermonForm } from "@/components/admin/SermonForm";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/sermons/$id")({
  ssr: false,
  component: EditSermon,
});

function EditSermon() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-sermon", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sermons").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell>
      <Link to="/admin/sermons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to sermons
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">Edit Sermon</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !data && <p className="text-muted-foreground">Sermon not found.</p>}
      {data && (
        <SermonForm
          initial={{
            id: data.id,
            title: data.title,
            preacher_name: data.preacher_name,
            date_preached: data.date_preached,
            scripture: data.scripture ?? "",
            series_name: data.series_name ?? "",
            description: data.description ?? "",
            video_url: data.video_url ?? "",
            audio_url: data.audio_url ?? "",
            notes_pdf_url: data.notes_pdf_url ?? "",
            thumbnail_url: data.thumbnail_url ?? "",
            tags: data.tags ?? [],
            status: data.status === "scheduled" ? "draft" : (data.status as "draft" | "published"),
            featured: data.featured,
          }}
        />
      )}
    </AdminShell>
  );
}
