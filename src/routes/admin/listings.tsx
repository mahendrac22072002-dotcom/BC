import { createFileRoute } from "@tanstack/react-router";
import { ListingsModeration } from "@/routes/staff/listings";

export const Route = createFileRoute("/admin/listings")({
  head: () => ({ meta: [{ title: "Listings — Admin" }] }),
  component: ListingsModeration,
});
