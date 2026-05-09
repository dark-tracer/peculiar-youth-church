import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <section className="relative bg-surface border-b border-border">
      <div className="container-x py-20 md:py-28 text-center">
        {eyebrow && (
          <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">{subtitle}</p>}
      </div>
    </section>
  );
}
