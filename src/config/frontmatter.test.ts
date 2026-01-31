// src/config/frontmatter.test.ts
import { describe, it, expect } from 'vitest';
import { extractFrontmatter, parseFrontmatterConfig } from './frontmatter';

describe('extractFrontmatter', () => {
  it('extracts YAML frontmatter', () => {
    const content = `---
title: My Note
latex:
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
});

describe('parseFrontmatterConfig', () => {
  it('extracts latex config from frontmatter', () => {
    const frontmatter = `
title: My Note
latex:
  preamble: ./custom.tex
  documentclass: report
`;
    const result = parseFrontmatterConfig(frontmatter);
    expect(result.preamble).toBe('./custom.tex');
    expect(result.documentclass).toBe('report');
  });

  it('returns empty config when no latex section', () => {
    const frontmatter = `title: Note`;
    const result = parseFrontmatterConfig(frontmatter);
    expect(result).toEqual({});
  });
});
