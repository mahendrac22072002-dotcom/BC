import { createFileRoute } from "@tanstack/react-router";
import { SupportInbox } from "@/routes/staff/support";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Support — Admin" }] }),
  component: SupportInbox,
});
