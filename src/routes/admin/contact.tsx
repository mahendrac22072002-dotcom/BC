import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({ meta: [{ title: "Contact Center" }] }),
  component: ContactLayout,
});

function ContactLayout() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const isIndex = pathname === "/admin/contact";

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Contact Center</h1>
        {!isIndex && (
          <Link to="/admin/contact" className="text-sm font-medium text-blue-600 hover:underline">
            &larr; Back to Inbox
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
