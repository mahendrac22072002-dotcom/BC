// PII masking helpers used by Staff Portal and any surface that lacks
// `broker.view_pii`. Admin with the permission bypasses these via `canViewPii`.

export function maskName(full?: string | null): string {
  if (!full) return "—";
  return full
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return part;
      return part[0] + "•".repeat(Math.min(6, part.length - 1));
    })
    .join(" ");
}

export function maskEmail(email?: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "—";
  if (local.length <= 1) return `${local}*@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 1)}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•".repeat(digits.length);
  return digits.slice(0, 2) + "*".repeat(Math.max(4, digits.length - 4)) + digits.slice(-2);
}

/** City + state only — strip street/landmark. Best-effort split on commas. */
export function maskAddress(address?: string | null, city?: string | null): string {
  if (city) return city;
  if (!address) return "—";
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.slice(-2).join(", ") || "—";
}

export function maskIdNumber(id?: string | null, keep = 4): string {
  if (!id) return "—";
  const clean = id.replace(/\s/g, "");
  if (clean.length <= keep) return "•".repeat(clean.length);
  return "•".repeat(clean.length - keep) + clean.slice(-keep);
}
