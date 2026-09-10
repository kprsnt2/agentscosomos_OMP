import React from "react";

interface MarkdownArticleProps {
  content: string;
}

function renderInline(text: string): React.ReactNode[] {
  // Regex splitting by inline code, bold, italic, and links
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-emerald-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
      return <strong key={i} className="font-semibold text-[--color-text]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} className="text-cyan-400 underline hover:text-cyan-300">
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

export function MarkdownArticle({ content }: MarkdownArticleProps) {
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let currentList: string[] = [];

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="list-disc list-inside space-y-1 my-3 text-[--color-text-dim]">
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="p-4 rounded-xl bg-black/70 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto my-4">
            <code>{codeBlockContent.join("\n")}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList(i);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // List item
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      currentList.push(line.trim().slice(2));
      continue;
    } else {
      flushList(i);
    }

    // Empty lines
    if (!line.trim()) {
      continue;
    }

    // Horizontal rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="border-white/10 my-6" />);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(<h1 key={`h1-${i}`} className="font-serif text-3xl font-bold text-[--color-text] mt-8 mb-4">{renderInline(line.slice(2))}</h1>);
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={`h2-${i}`} className="font-mono text-xl font-bold text-cyan-300 mt-6 mb-3 border-b border-white/10 pb-1">{renderInline(line.slice(3))}</h2>);
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={`h3-${i}`} className="font-mono text-base font-semibold text-purple-300 mt-4 mb-2">{renderInline(line.slice(4))}</h3>);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-2 border-emerald-500/60 pl-4 py-1 italic text-slate-400 my-3 bg-emerald-950/20 rounded-r">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-[--color-text-dim] my-3">
        {renderInline(line)}
      </p>
    );
  }

  flushList(lines.length);

  return <article className="prose-agent max-w-none">{elements}</article>;
}
