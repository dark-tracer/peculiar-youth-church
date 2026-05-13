import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import {
  BookOpen,
  CalendarHeart,
  Sprout,
  CreditCard,
  Smartphone,
  Apple,
  Building2,
  Heart,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ============================================================
// 🔑 PAYSTACK PUBLIC KEY — replace the value below with your
// real Paystack public key (starts with pk_live_ or pk_test_).
// ============================================================
const PAYSTACK_PUBLIC_KEY = "pk_live_REPLACE_WITH_YOUR_KEY";

const PAYSTACK_SCRIPT_URL = "https://js.paystack.co/v1/inline.js";

const PRESETS = [20, 50, 100, 200];

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export const Route = createFileRoute("/give")({
  head: () => ({
    meta: [
      { title: "Give — Peculiar Youth & Children Ministry" },
      {
        name: "description",
        content:
          "Support Peculiar Youth & Children Ministry. Your giving equips young people, funds events, and grows the ministry.",
      },
      { property: "og:title", content: "Give — Peculiar Youth & Children Ministry" },
      {
        property: "og:description",
        content: "Give securely via Paystack. Card, Mobile Money, Apple Pay & Bank Transfer.",
      },
    ],
  }),
  component: GivePage,
});

function GivePage() {
  const [amount, setAmount] = useState<number>(50);
  const [custom, setCustom] = useState<string>("");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "info" | "error"; msg: string } | null>(
    null,
  );
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.PaystackPop) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PAYSTACK_SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }
    const s = document.createElement("script");
    s.src = PAYSTACK_SCRIPT_URL;
    s.async = true;
    s.onload = () => setScriptReady(true);
    document.body.appendChild(s);
  }, []);

  const finalAmount = custom ? Number(custom) : amount;

  const handleGive = () => {
    setStatus(null);
    if (!finalAmount || finalAmount <= 0) {
      setStatus({ kind: "error", msg: "Please choose or enter a valid amount." });
      return;
    }
    if (!name.trim() || !email.trim()) {
      setStatus({ kind: "error", msg: "Please enter your name and email." });
      return;
    }
    if (!window.PaystackPop) {
      setStatus({ kind: "error", msg: "Payment library is still loading. Please try again." });
      return;
    }
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(finalAmount * 100),
      currency: "GHS",
      label: name,
      metadata: {
        custom_fields: [
          { display_name: "Frequency", variable_name: "frequency", value: frequency },
          { display_name: "Full Name", variable_name: "full_name", value: name },
        ],
      },
      callback: () => {
        setStatus({
          kind: "success",
          msg: "Thank you for your gift. Your generosity is making a difference.",
        });
      },
      onClose: () => {
        setStatus({
          kind: "info",
          msg: "Payment was not completed. You can try again whenever you are ready.",
        });
      },
    });
    handler.openIframe();
  };

  const impacts = [
    {
      icon: BookOpen,
      title: "Equip Young People",
      desc: "Funding resources, Bibles, and materials for our youth.",
    },
    {
      icon: CalendarHeart,
      title: "Host Events",
      desc: "Covering the cost of services, camps, and outreach programs.",
    },
    {
      icon: Sprout,
      title: "Grow the Ministry",
      desc: "Supporting the day to day operations of Peculiar Youth and Children Ministry.",
    },
  ];

  const methods = [
    { icon: CreditCard, label: "Debit & Credit Card" },
    { icon: Smartphone, label: "Mobile Money" },
    { icon: Apple, label: "Apple Pay" },
    { icon: Building2, label: "Bank Transfer" },
  ];

  return (
    <PageShell>
      <PageHero
        eyebrow="Give"
        title="Support the Ministry"
        subtitle="Your giving helps us equip, empower, and send out the next generation. Every contribution makes a difference."
      />

      {/* Impact cards */}
      <section className="container-x py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {impacts.map((i) => (
            <div
              key={i.title}
              className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                <i.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{i.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{i.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Giving form */}
      <section className="bg-surface border-y border-border">
        <div className="container-x py-16 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-2xl font-bold">Make a gift</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Secure giving powered by Paystack.
            </p>

            {/* Amount */}
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-2">Amount</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                  const active = !custom && amount === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setAmount(p);
                        setCustom("");
                      }}
                      className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border bg-background hover:border-brand/50"
                      }`}
                    >
                      GHS {p}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    GHS
                  </span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="Custom amount"
                    className="w-full rounded-lg border border-border bg-background pl-14 pr-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </div>

            {/* Frequency */}
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-2">Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {(["one-time", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`rounded-lg border px-3 py-3 text-sm font-semibold capitalize transition ${
                      frequency === f
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border bg-background hover:border-brand/50"
                    }`}
                  >
                    {f === "one-time" ? "One Time" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-1.5">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="Your full name"
              />
            </div>

            {/* Email */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="button"
              onClick={handleGive}
              disabled={!scriptReady}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Heart className="h-4 w-4" />
              Give Now
            </button>

            {status && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  status.kind === "success"
                    ? "border-brand/30 bg-brand-soft text-brand"
                    : status.kind === "error"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {status.msg}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Payment methods */}
      <section className="container-x py-16">
        <div className="text-center">
          <h2 className="text-xl font-bold">Accepted payment methods</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {methods.map((m) => (
              <div
                key={m.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
              >
                <m.icon className="h-4 w-4 text-brand" />
                {m.label}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            All transactions are secure and processed by Paystack.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface border-y border-border">
        <div className="container-x py-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-center">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="q1">
              <AccordionTrigger>Is my payment secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. All payments are processed through Paystack, a trusted and certified payment
                provider.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Can I give in a different currency?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently we accept giving in Ghana Cedis only.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>
                Who do I contact if I have an issue with my payment?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Send an email to the church contact email and our team will assist you within 24
                hours.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Scripture banner */}
      <section className="container-x py-16">
        <blockquote className="rounded-2xl bg-brand text-brand-foreground p-8 md:p-12 text-center">
          <p className="text-lg md:text-xl font-medium leading-relaxed">
            "Each of you should give what you have decided in your heart to give, not reluctantly or
            under compulsion, for God loves a cheerful giver."
          </p>
          <footer className="mt-4 text-sm font-semibold opacity-90">2 Corinthians 9:7</footer>
        </blockquote>
      </section>
    </PageShell>
  );
}
