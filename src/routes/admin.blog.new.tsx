import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/blog/new")({
  ssr: false,
  component: NewBlog,
});

function NewBlog() {
  return (
    <AdminShell>
      <Link to="/admin/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to blog posts
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">New Blog Post</h1>
      <PostForm kind="blog" />
    </AdminShell>
  );
}
