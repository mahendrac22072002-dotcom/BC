import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/brokersconnect-logo.png.asset.json";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={"inline-flex items-center " + (className ?? "")} aria-label="BrokersConnect home">
      <img
        src={logoAsset.url}
        alt="BrokersConnect — Real Estate. Simplified."
        className="h-9 w-auto"
        width={180}
        height={36}
      />
    </Link>
  );
}
