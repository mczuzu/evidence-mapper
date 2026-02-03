import ReactMarkdown from 'react-markdown';

interface MarkdownTextProps {
  children: string | null | undefined;
  className?: string;
}

/**
 * Renders text as Markdown with light prose styling.
 * Used across analysis sections to format backend-generated content.
 */
export function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  if (!children) return null;
  
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1 ${className}`}>
      <ReactMarkdown>
        {children}
      </ReactMarkdown>
    </div>
  );
}
