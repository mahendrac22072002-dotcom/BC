import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { StaffTopbar } from "@/components/staff/StaffTopbar";

export const Route = createFileRoute("/staff")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const rs = (roles ?? []).map((r) => r.role as string);
    if (!rs.includes("staff") && !rs.includes("admin")) {
      throw redirect({ to: "/dashboard" });
    }
    return { user: data.user, roles: rs };
  },
  component: StaffLayout,
});

function StaffLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <StaffSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <StaffTopbar />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
