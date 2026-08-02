import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "b", "strong", "i", "em", "u", "s", "code", "pre",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote", "hr",
    "a", "img", "span", "div",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
  disallowedTagsMode: "discard",
};

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}

export function SafeHtml({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />
  );
}
