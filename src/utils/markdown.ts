import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  bulletListMarker: '-',
});

turndown.addRule('strikethrough', {
  filter: ['del', 's', 'strike' as 'del'],
  replacement: (content) => `~~${content}~~`,
});

export type MarkdownResult = {
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  markdown: string;
  text: string;
  length: number;
};

export function htmlToMarkdown(html: string, url?: string): MarkdownResult {
  const dom = new JSDOM(html, url ? { url } : undefined);
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    // Fall back to converting whole HTML body
    const body = dom.window.document.body?.innerHTML ?? html;
    const md = turndown.turndown(body);
    return {
      title: dom.window.document.title || null,
      byline: null,
      excerpt: null,
      markdown: md,
      text: dom.window.document.body?.textContent?.trim() ?? '',
      length: md.length,
    };
  }

  const md = turndown.turndown(article.content ?? '');
  return {
    title: article.title ?? null,
    byline: article.byline ?? null,
    excerpt: article.excerpt ?? null,
    markdown: md,
    text: article.textContent?.trim() ?? '',
    length: md.length,
  };
}
