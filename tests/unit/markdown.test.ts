import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from '../../src/utils/markdown.js';

describe('htmlToMarkdown', () => {
  it('extracts article content from a basic HTML page', () => {
    const html = `<!doctype html><html><head><title>Test</title></head><body>
      <article>
        <h1>Hello World</h1>
        <p>This is the <strong>first</strong> paragraph.</p>
        <p>And here is a <a href="https://example.com">link</a>.</p>
      </article>
    </body></html>`;
    const r = htmlToMarkdown(html, 'https://example.test/');
    expect(r.markdown).toMatch(/Hello World/);
    expect(r.markdown).toMatch(/\*\*first\*\*|_first_/);
    expect(r.markdown).toMatch(/link/);
    expect(r.length).toBeGreaterThan(0);
  });

  it('falls back when readability cannot parse', () => {
    const r = htmlToMarkdown('<html><body><div>x</div></body></html>');
    expect(typeof r.markdown).toBe('string');
  });
});
