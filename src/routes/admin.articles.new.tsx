import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/articles/new")({
  ssr: false,
  component: NewArticle,
});

function NewArticle() {
  return (
    <AdminShell>
      <Link to="/admin/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to articles
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">New Article</h1>
      <PostForm kind="article" />
    </AdminShell>
  );
}
