import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { recordContentView } from "@/lib/views.functions";

export function ViewCount({
  contentType,
  contentId,
  className = "",
}: {
  contentType: "blog" | "article";
  contentId: string | undefined;
  className?: string;
}) {
  const record = useServerFn(recordContentView);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!contentId) return;
    let active = true;
    record({ data: { contentType, contentId } })
      .then((res) => {
        if (active) setCount(res.count);
      })
      .catch(() => {
        /* view tracking must never break the page */
      });
    return () => {
      active = false;
    };
  }, [contentId, contentType, record]);

  if (count === null) return null;
  const label = count === 1 ? "read" : "reads";


  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-brand/80 ${className}`}
      aria-label={`${count} ${label}`}
    >
      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      {count.toLocaleString()} {label}
    </span>

  );
}
