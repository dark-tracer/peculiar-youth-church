import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/blog/$id")({
  ssr: false,
  component: EditBlog,
});

function EditBlog() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell>
      <Link to="/admin/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to blog posts
      </Link>
      <h1 className="text-3xl font-display font-bold mb-6">Edit Blog Post</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && !data && <p className="text-muted-foreground">Post not found.</p>}
      {data && (
        <PostForm
          kind="blog"
          initial={{
            id: data.id,
            title: data.title,
            author_name: data.author_name ?? "",
            publish_date: data.publish_date ?? new Date().toISOString().slice(0, 10),
            excerpt: data.excerpt ?? "",
            body: data.body ?? "",
            cover_url: data.cover_url ?? "",
            category: data.category ?? "",
            column_name: "",
            edition_label: "",
            tags: data.tags ?? [],
            status: data.status === "scheduled" ? "draft" : (data.status as "draft" | "published"),
          }}
        />
      )}
    </AdminShell>
  );
}
