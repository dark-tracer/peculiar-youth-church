import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { GatedDownloadButton } from "@/components/GatedDownloadButton";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Headphones } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/sermons/$slug")({
  component: SermonDetail,
});

function getYouTubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

function SermonDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["sermon", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Loading…</div></PageShell>;
  if (!data) return <PageShell><div className="container-x py-20 text-center text-muted-foreground">Sermon not found.</div></PageShell>;

  const embed = data.video_url ? getYouTubeEmbed(data.video_url) : null;

  return (
    <PageShell>
      <article className="container-x py-12 max-w-4xl">
        <Link to="/sermons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> All sermons
        </Link>

        {data.series_name && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{data.series_name}</p>}
        <h1 className="mt-2 text-4xl font-bold">{data.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.preacher_name} · {format(new Date(data.date_preached), "MMMM d, yyyy")}
          {data.scripture && ` · ${data.scripture}`}
        </p>

        {embed && (
          <div className="mt-8 aspect-video rounded-2xl overflow-hidden border border-border bg-card">
            <iframe src={embed} title={data.title} allowFullScreen className="h-full w-full" />
          </div>
        )}

        {!embed && data.thumbnail_url && (
          <img src={data.thumbnail_url} alt={data.title} className="mt-8 w-full rounded-2xl object-cover" />
        )}

        {(data.audio_url || data.notes_pdf_url) && (
          <div className="mt-6 flex flex-wrap gap-2">
            {data.audio_url && (
              <GatedDownloadButton
                bucket="sermon-audio"
                path={data.audio_url}
                className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-semibold hover:bg-foreground/10 disabled:opacity-60"
              >
                <Headphones className="h-4 w-4" /> Listen to audio
              </GatedDownloadButton>
            )}
            {data.notes_pdf_url && (
              <GatedDownloadButton
                bucket="sermon-pdfs"
                path={data.notes_pdf_url}
                download
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-60"
              >
                <Download className="h-4 w-4" /> Download notes
              </GatedDownloadButton>
            )}
          </div>
        )}

        {data.description && (
          <div className="prose prose-lg max-w-none mt-10" dangerouslySetInnerHTML={{ __html: data.description }} />
        )}

        {data.tags && data.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {data.tags.map((t: string) => (
              <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </article>
    </PageShell>
  );
}
