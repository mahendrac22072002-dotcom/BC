// Shared lightweight markdown renderer used by /$slug and the CMS preview pane.
// Mirrors the renderer in src/routes/$slug.tsx so preview output matches live.

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMarkdown(src: string): string {
  const lines = (src ?? "").split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      out.push(`<h3>${esc(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(`<h2>${esc(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      flushList();
      out.push(`<h1>${esc(line.slice(2))}</h1>`);
    } else if (/^>\s?/.test(line)) {
      flushList();
      out.push(`<blockquote>${esc(line.replace(/^>\s?/, ""))}</blockquote>`);
    } else if (/^---+$/.test(line)) {
      flushList();
      out.push("<hr />");
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${esc(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else {
      flushList();
      const bolded = esc(line)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
      out.push(`<p>${bolded}</p>`);
    }
  }
  flushList();
  return out.join("\n");
}
