import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/artworks/new")({
  ssr: false,
  component: NewArtwork,
});

function NewArtwork() {
  return (
    <AdminShell>
      <Link to="/admin/artworks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to artworks
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">New Artwork</h1>
      <ArtworkForm />
    </AdminShell>
  );
}
