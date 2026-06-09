import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/artworks/$id")({
  ssr: false,
  component: EditArtwork,
});

function EditArtwork() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-artworks", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("artworks").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell>
      <Link to="/admin/artworks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to artworks
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">Edit Artwork</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !data && <p className="text-muted-foreground">Artwork not found.</p>}
      {data && (
        <ArtworkForm
          initial={{
            id: data.id,
            title: data.title,
            artist_name: data.artist_name ?? "",
            description: data.description ?? "",
            scripture: data.scripture ?? "",
            image_url: data.image_url ?? "",
            category: data.category ?? "",
            tags: data.tags ?? [],
            allow_download: data.allow_download,
            watermark: data.watermark,
            featured: data.featured,
            status: data.status === "scheduled" ? "draft" : (data.status as "draft" | "published"),
          }}
        />
      )}
    </AdminShell>
  );
}
