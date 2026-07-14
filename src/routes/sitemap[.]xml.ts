import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://peculiar-youth-church.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.8" },
          { path: "/contact", changefreq: "monthly", priority: "0.8" },
          { path: "/give", changefreq: "monthly", priority: "0.7" },
          { path: "/events", changefreq: "weekly", priority: "0.8" },
          { path: "/sermons", changefreq: "weekly", priority: "0.9" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          { path: "/articles", changefreq: "weekly", priority: "0.7" },
          { path: "/bible-studies", changefreq: "weekly", priority: "0.8" },
          { path: "/artworks", changefreq: "weekly", priority: "0.6" },
          { path: "/newsletter", changefreq: "monthly", priority: "0.5" },
        ];

        try {
          const [sermons, posts, events, studies, articles, artworks] = await Promise.all([
            supabase.from("sermons").select("slug, updated_at").eq("status", "published"),
            supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
            supabase.from("events").select("slug, updated_at").eq("status", "published"),
            supabase.from("bible_studies").select("slug, updated_at").eq("status", "published"),
            supabase.from("articles").select("slug, updated_at").eq("status", "published"),
            supabase.from("artworks").select("slug, updated_at").eq("status", "published"),
          ]);

          sermons.data?.forEach((r) => entries.push({ path: `/sermons/${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "monthly", priority: "0.7" }));
          posts.data?.forEach((r) => entries.push({ path: `/blog/${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" }));
          events.data?.forEach((r) => entries.push({ path: `/events/${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "weekly", priority: "0.7" }));
          studies.data?.forEach((r) => entries.push({ path: `/bible-studies/${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" }));
          articles.data?.forEach((r) => entries.push({ path: `/articles/${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "monthly", priority: "0.6" }));
          artworks.data?.forEach((r) => entries.push({ path: `/artworks#${r.slug}`, lastmod: r.updated_at ?? undefined, changefreq: "monthly", priority: "0.5" }));
        } catch (err) {
          console.error("sitemap: failed to load dynamic entries", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
