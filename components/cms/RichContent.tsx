import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils";
import { richContentClasses } from "./rich-content-classes";

interface RichContentProps {
  html: string;
  className?: string;
}

// sanitize-html rather than isomorphic-dompurify: the latter drags in
// jsdom -> html-encoding-sniffer -> an ESM-only transitive dependency that
// fails with ERR_REQUIRE_ESM in Vercel's serverless Node runtime (it built
// and ran fine locally — the bundling difference only shows up in
// production). sanitize-html has no jsdom dependency and is a standard,
// well-maintained choice for exactly this "sanitize admin-authored HTML
// server-side" use case.
const ALLOWED_TAGS = ["h2", "h3", "p", "ul", "ol", "li", "a", "strong", "em", "blockquote", "br"];

// Server-side sanitization is the actual XSS defense — content came from an
// admin-controlled rich text editor, but is stored as raw HTML and rendered
// with dangerouslySetInnerHTML, so it's sanitized on every render rather
// than trusted based on where it came from.
export function RichContent({ html, className }: RichContentProps) {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
  });

  return (
    <div
      className={cn(richContentClasses, className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
