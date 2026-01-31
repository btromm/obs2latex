// src/config/style.test.ts
import { describe, it, expect } from 'vitest';
import { parseStyleFile, StyleConfig, DEFAULT_STYLE } from './style';

describe('parseStyleFile', () => {
  it('parses complete style file', () => {
    const yaml = `
preamble: ./preamble.tex
documentclass: book
classoptions:
  - 12pt
  - a4paper
order:
  - intro
  - chapter1
`;
    const result = parseStyleFile(yaml);
    expect(result.preamble).toBe('./preamble.tex');
    expect(result.documentclass).toBe('book');
    expect(result.classoptions).toEqual(['12pt', 'a4paper']);
    expect(result.order).toEqual(['intro', 'chapter1']);
  });

  it('uses defaults for missing fields', () => {
    const yaml = `documentclass: report`;
    const result = parseStyleFile(yaml);
    expect(result.documentclass).toBe('report');
    expect(result.preamble).toBe('');
    expect(result.classoptions).toEqual([]);
  });

  it('returns defaults for empty input', () => {
    const result = parseStyleFile('');
    expect(result).toEqual(DEFAULT_STYLE);
  });
});
