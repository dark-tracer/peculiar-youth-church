import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { Mail, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter — Peculiar Youth & Children Ministry" },
      { name: "description", content: "Subscribe to our newsletter for updates, devotionals, and event news from Peculiar Youth Church." },
      { property: "og:title", content: "Newsletter — Peculiar Youth & Children Ministry" },
      { property: "og:description", content: "Stay in the loop with sermons, events, and devotionals." },
    ],
  }),
  component: Newsletter,
});

function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <PageShell>
      <PageHero
        eyebrow="Stay Connected"
        title="Join our newsletter."
        subtitle="Get sermons, event updates, and devotionals delivered straight to your inbox."
      />

      <section className="container-x py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 md:p-10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Subscribe</h2>
              <p className="text-sm text-muted-foreground">
                <span className="text-brand">*</span> indicates required
              </p>
            </div>
          </div>

          <form
            action="https://gmail.us18.list-manage.com/subscribe/post?u=7fa02db303aaf5cd292bb9fcd&id=d27a85dc30&f_id=008fabe6f0"
            method="post"
            target="_blank"
            noValidate
            onSubmit={() => setSubmitted(true)}
            className="mt-8 space-y-5"
          >
            <div>
              <label htmlFor="mce-FNAME" className="block text-sm font-semibold mb-1.5">
                First Name <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                name="FNAME"
                id="mce-FNAME"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label htmlFor="mce-LNAME" className="block text-sm font-semibold mb-1.5">
                Last Name <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                name="LNAME"
                id="mce-LNAME"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label htmlFor="mce-EMAIL" className="block text-sm font-semibold mb-1.5">
                Email Address <span className="text-brand">*</span>
              </label>
              <input
                type="email"
                name="EMAIL"
                id="mce-EMAIL"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label htmlFor="mce-PHONE" className="block text-sm font-semibold mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                name="PHONE"
                id="mce-PHONE"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Honeypot */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-5000px" }}>
              <input
                type="text"
                name="b_7fa02db303aaf5cd292bb9fcd_d27a85dc30"
                tabIndex={-1}
                defaultValue=""
              />
            </div>

            <button
              type="submit"
              name="subscribe"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-foreground hover:opacity-90"
            >
              Subscribe <Send className="h-4 w-4" />
            </button>

            {submitted && (
              <p className="flex items-center gap-2 text-sm text-brand">
                <CheckCircle2 className="h-4 w-4" /> Thanks! Check the new tab to confirm your subscription.
              </p>
            )}
          </form>
        </div>
      </section>
    </PageShell>
  );
}
