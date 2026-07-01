import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getGatedAssetUrl } from "@/lib/storage.functions";
import { useAuth } from "@/hooks/use-auth";

type Bucket = "sermon-audio" | "sermon-pdfs" | "study-pdfs";

interface Props {
  bucket: Bucket;
  path: string;
  className?: string;
  children: ReactNode;
  /** Force download attribute filename */
  download?: boolean;
}

export function GatedDownloadButton({ bucket, path, className, children, download }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const sign = useServerFn(getGatedAssetUrl);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (loading) return;
    if (!user) {
      toast.info("Please sign in to download this resource.");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      const { url } = await sign({ data: { bucket, path } });
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      if (download) a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={onClick} disabled={busy} className={className}>
      {children}
    </button>
  );
}
