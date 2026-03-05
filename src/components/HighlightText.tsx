import React from "react";

interface HighlightTextProps {
  text: string;
  terms: string[];
  className?: string;
}

/**
 * Renders text with matching search terms highlighted.
 */
export function HighlightText({ text, terms, className }: HighlightTextProps) {
  if (!text || terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build regex from terms, escaping special chars
  const escaped = terms
    .filter((t) => t.trim().length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  // Build a Set of lowercased terms for O(1) match check (avoids regex lastIndex bug)
  const termsLower = new Set(escaped.map((t) => t.toLowerCase()));
  const isMatch = (part: string) => termsLower.has(part.toLowerCase());

  return (
    <span className={className}>
      {parts.map((part, i) =>
        isMatch(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}
