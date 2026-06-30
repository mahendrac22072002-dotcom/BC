import { Link } from "@tanstack/react-router";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={"inline-flex items-center " + (className ?? "")} aria-label="BrokersConnect home">
      <img
        src="/brokers-connect-logo.jpeg"
        alt="BrokersConnect"
        className="h-9 w-auto object-contain"
        width={180}
        height={36}
      />
    </Link>
  );
}
