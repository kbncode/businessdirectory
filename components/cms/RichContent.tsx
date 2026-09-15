import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { richContentClasses } from "./rich-content-classes";

interface RichContentProps {
  html: string;
  className?: string;
}

const ALLOWED_TAGS = [
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "em",
  "blockquote",
  "br",
];

// Server-side sanitization is the actual XSS defense — content came from an
// admin-controlled rich text editor, but is stored as raw HTML and rendered
// with dangerouslySetInnerHTML, so it's sanitized on every render rather
// than trusted based on where it came from.
export function RichContent({ html, className }: RichContentProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  return (
    <div
      className={cn(richContentClasses, className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
