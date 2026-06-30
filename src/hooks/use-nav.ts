import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = {
  id: string;
  location: "header" | "footer";
  label: string;
  href: string;
  parent_id: string | null;
  position: number;
  visible: boolean;
  open_in_new_tab: boolean;
};

export function useNavItems(location: "header" | "footer") {
  return useQuery({
    queryKey: ["nav_items", location],
    staleTime: 60_000,
    queryFn: async (): Promise<NavItem[]> => {
      const { data, error } = await supabase
        .from("nav_items")
        .select("*")
        .eq("location", location)
        .eq("visible", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NavItem[];
    },
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("singleton", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
