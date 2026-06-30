import { createFileRoute } from "@tanstack/react-router";
import { ReportsQueue } from "@/routes/staff/reports";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: ReportsQueue,
});
