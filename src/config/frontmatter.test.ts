// src/config/frontmatter.test.ts
import { describe, it, expect } from 'vitest';
import { extractFrontmatter, parseFrontmatterConfig } from './frontmatter';

describe('extractFrontmatter', () => {
  it('extracts YAML frontmatter', () => {
    const content = `---
title: My Note
documentclass: book
---

# Content here`;

    const result = extractFrontmatter(content);
    expect(result.frontmatter).toContain('title: My Note');
    expect(result.body).toContain('# Content here');
    expect(result.body).not.toContain('---');
  });

  it('handles content without frontmatter', () => {
    const content = '# Just content';
    const result = extractFrontmatter(content);
    expect(result.frontmatter).toBe('');
    expect(result.body).toBe('# Just content');
  });

  it('handles Windows CRLF line endings', () => {
    const content = '---\r\ntitle: Test\r\n---\r\n\r\n# Content';
    const result = extractFrontmatter(content);
    expect(result.frontmatter).toContain('title: Test');
    expect(result.body).toContain('# Content');
  });
});

describe('parseFrontmatterConfig', () => {
  it('extracts latex config from frontmatter', () => {
    const frontmatter = `
title: My Note
preamble: ./custom.tex
documentclass: report
`;
    const result = parseFrontmatterConfig(frontmatter);
    expect(result.preamble).toBe('./custom.tex');
    expect(result.documentclass).toBe('report');
  });

  it('extracts classoptions array', () => {
    const frontmatter = `
documentclass: book
classoptions:
  - 12pt
  - twoside
`;
    const result = parseFrontmatterConfig(frontmatter);
    expect(result.documentclass).toBe('book');
    expect(result.classoptions).toEqual(['12pt', 'twoside']);
  });

  it('ignores unrelated properties', () => {
    const frontmatter = `
title: Note
tags: [math, physics]
`;
    const result = parseFrontmatterConfig(frontmatter);
    expect(result).toEqual({});
  });
});
