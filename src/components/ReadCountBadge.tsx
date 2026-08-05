import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Read-only reads counter for list/card views (does not record a view). */
export function useReadCounts(contentType: "blog" | "article") {
  return useQuery({
    queryKey: ["view-counts", contentType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_view_counts")
        .select("content_id, unique_view_count")
        .eq("content_type", contentType);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) map[row.content_id] = row.unique_view_count;
      return map;
    },
  });
}

export function ReadCountBadge({ count }: { count: number | undefined }) {
  const value = count ?? 0;
  const label = value === 1 ? "read" : "reads";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand/80" aria-label={`${value} ${label}`}>
      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      {value.toLocaleString()} {label}
    </span>
  );
}
