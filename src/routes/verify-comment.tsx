import { useEffect, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { verifyComment } from "@/lib/comments.functions";

export const Route = createFileRoute("/verify-comment")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Confirm your comment — Peculiar Youth" },
      { name: "description", content: "Confirm your comment so it goes live on the Peculiar Youth website." },
      { property: "og:title", content: "Confirm your comment — Peculiar Youth" },
      { property: "og:description", content: "Confirm your comment so it goes live on the Peculiar Youth website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyComment,
});

function VerifyComment() {
  const { token } = useSearch({ from: "/verify-comment" });
  const verify = useServerFn(verifyComment);
  const [state, setState] = useState<"loading" | "verified" | "expired" | "error">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await verify({ data: { token } });
        if (!active) return;
        setState(res.status === "verified" ? "verified" : res.status === "expired" ? "expired" : "error");
      } catch {
        if (active) setState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [token, verify]);

  return (
    <PageShell>
      <div className="container-x max-w-xl py-24 text-center">
        {state === "loading" && (
          <p className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Confirming your comment…
          </p>
        )}
        {state === "verified" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand" />
            <h1 className="mt-4 text-3xl font-bold">Your comment is now live.</h1>
            <p className="mt-2 text-muted-foreground">Thanks for joining the conversation.</p>
          </>
        )}
        {state === "expired" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">
              This verification link has expired. Please submit your comment again.
            </h1>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">This verification link is not valid.</h1>
            <p className="mt-2 text-muted-foreground">It may already have been used.</p>
          </>
        )}
        <Link to="/blog" className="mt-8 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground">
          Back to the blog
        </Link>
      </div>
    </PageShell>
  );
}
