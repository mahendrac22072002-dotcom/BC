import { createFileRoute } from "@tanstack/react-router";
import { KycReview } from "@/components/kyc/KycReview";

export const Route = createFileRoute("/staff/kyc")({
  head: () => ({ meta: [{ title: "KYC — Staff" }] }),
  component: () => <KycReview mode="staff" />,
});
