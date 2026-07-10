import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageKey =
  | "home_hero"
  | "home_about"
  | "home_verse"
  | "home_service_times"
  | "home_mission"
  | "about_page"
  | "contact_page";

export type PageData = Record<string, string>;

export async function fetchPageContent(key: PageKey): Promise<PageData> {
  const { data, error } = await supabase
    .from("page_content")
    .select("data")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as PageData | null) ?? {};
}

export function usePageContent<T extends PageData = PageData>(
  key: PageKey,
  defaults: T,
) {
  const { data } = useQuery({
    queryKey: ["page_content", key],
    queryFn: () => fetchPageContent(key),
  });
  return { ...defaults, ...(data ?? {}) } as T;
}

export async function savePageContent(key: PageKey, data: PageData, userId: string) {
  const { error } = await supabase
    .from("page_content")
    .upsert({ key, data, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
}
