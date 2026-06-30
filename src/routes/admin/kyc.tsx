import { createFileRoute } from "@tanstack/react-router";
import { KycReview } from "@/components/kyc/KycReview";

export const Route = createFileRoute("/admin/kyc")({
  head: () => ({ meta: [{ title: "KYC Verification — Admin" }] }),
  component: () => <KycReview mode="admin" />,
});
