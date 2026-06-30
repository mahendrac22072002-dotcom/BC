export function formatINR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(n % 1_00_00_000 === 0 ? 0 : 2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 2)} L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function initials(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function errMessage(e: unknown, fallback = "Something went wrong"): string {
  if (!e) return fallback;
  
  let userMessage = fallback;
  
  if (typeof e === "string") {
    userMessage = e;
  } else if (e instanceof Error) {
    userMessage = e.message || fallback;
  } else if (typeof e === "object") {
    const o = e as { code?: string; message?: string; details?: string; hint?: string; error_description?: string };
    
    // Log the full detailed error to the console for developers
    console.error("[Database Error]", {
      code: o.code,
      message: o.message,
      details: o.details,
      hint: o.hint,
      error_description: o.error_description
    });
    
    if (typeof o.message === "string" && o.message) userMessage = o.message;
    else if (typeof o.error_description === "string" && o.error_description) userMessage = o.error_description;
    else if (typeof o.hint === "string" && o.hint) userMessage = o.hint;
  }

  return userMessage;
}
