'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Renders admin-authored Markdown safely — react-markdown parses to React
 * elements directly (no dangerouslySetInnerHTML), and raw HTML embedded in
 * the Markdown source is NOT enabled (no rehype-raw plugin), so it's
 * rendered as literal escaped text instead of being executed. That's the
 * XSS protection the brief asks for, without needing a separate
 * sanitizer. */
export default function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-tiktok-pink prose-img:rounded-xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
