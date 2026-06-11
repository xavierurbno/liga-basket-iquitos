import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-6 text-3xl font-black tracking-tight text-white sm:text-4xl">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-4 mt-10 scroll-mt-24 border-b border-slate-800 pb-2 text-xl font-bold text-white sm:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-8 text-lg font-semibold text-slate-100">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-base leading-relaxed text-slate-300">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="text-slate-200">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-300 marker:text-indigo-400">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-2 pl-6 text-slate-300 marker:text-indigo-400">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-[#7eb4ff] underline decoration-[#7eb4ff]/40 underline-offset-2 transition hover:text-white hover:decoration-white"
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      target={href?.startsWith("http") ? "_blank" : undefined}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-indigo-500/60 bg-slate-900/50 py-3 pl-4 pr-3 text-slate-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-slate-800" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-900/80">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-800/80">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold text-slate-200">{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-3 text-slate-300">{children}</td>,
};

type LegalMarkdownProps = {
  content: string;
};

/** Renderiza Markdown estático con estilo legal premium (sin HTML crudo). */
export function LegalMarkdown({ content }: LegalMarkdownProps) {
  return (
    <article className="legal-markdown max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
