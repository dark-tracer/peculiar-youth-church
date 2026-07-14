import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Get in touch, plan your first visit, or find our service times and location in Kasoa, Ghana." },
      { property: "og:title", content: "Contact — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Address, phone, email, service times, and directions to our Kasoa campus." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://peculiar-youth-church.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://peculiar-youth-church.lovable.app/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "PlaceOfWorship",
          name: "Peculiar Youth & Children Ministry",
          url: "https://peculiar-youth-church.lovable.app/contact",
          telephone: "+233-50-367-7447",
          email: "peculiaryouthchurch.pyc@gmail.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "C.P",
            addressLocality: "Kasoa",
            addressRegion: "Central Region",
            addressCountry: "GH",
          },
        }),
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const c = usePageContent("contact_page", {
    hero_title: "Let's talk.",
    hero_subtitle: "Got a question? Planning your first visit? Drop us a message — we'd love to meet you.",
    address: "C.P, Kasoa, Central Region, Ghana",
    phone: "+233 50 367 7447",
    email: "peculiaryouthchurch.pyc@gmail.com",
    service_times: "Sunday Service · 11:00 AM\nBible Study · Sundays · 6:00 PM\nWorship Sunday · First Sunday of every month",
  });

  return (
    <PageShell>
      <PageHero eyebrow="Contact" title={c.hero_title} subtitle={c.hero_subtitle} />


      <section className="container-x py-16 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-8">
          {sent ? (
            <div className="text-center py-12">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
                <Send className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-bold">Message sent!</h3>
              <p className="mt-2 text-muted-foreground">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-5"
            >
              <h2 className="text-2xl font-bold">Send us a message</h2>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Name</label>
                <input required className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Email</label>
                <input required type="email" className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Message</label>
                <textarea required rows={5} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none" placeholder="How can we help?" />
              </div>
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-foreground hover:opacity-90">
                Send Message <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {[
            { icon: MapPin, title: "Visit", value: c.address },
            { icon: Phone, title: "Call", value: c.phone },
            { icon: Mail, title: "Email", value: c.email },
            { icon: Clock, title: "Service Times", value: c.service_times },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5 flex gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand flex-shrink-0">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.title}</p>
                <p className="font-semibold whitespace-pre-line">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      <section className="container-x pb-20">
        <div className="rounded-2xl overflow-hidden border border-border aspect-[16/7] bg-surface">
          <iframe
            title="Church location"
            src="https://www.google.com/maps?q=Peculiar+International+School,+Kasoa,+Central+Region,+Ghana&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </section>
    </PageShell>
  );
}
