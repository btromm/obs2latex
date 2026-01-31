// src/config/index.test.ts
import { describe, it, expect } from 'vitest';
import { mergeConfigs } from './index';
import { DEFAULT_STYLE } from './style';

describe('mergeConfigs', () => {
  it('frontmatter overrides style file', () => {
    const styleConfig = { ...DEFAULT_STYLE, documentclass: 'article' };
    const frontmatterConfig = { documentclass: 'book' };

    const result = mergeConfigs(styleConfig, frontmatterConfig);
    expect(result.documentclass).toBe('book');
  });

  it('preserves style config when frontmatter empty', () => {
    const styleConfig = { ...DEFAULT_STYLE, preamble: './my.tex' };
    const frontmatterConfig = {};

    const result = mergeConfigs(styleConfig, frontmatterConfig);
    expect(result.preamble).toBe('./my.tex');
  });

  it('merges classoptions arrays', () => {
    const styleConfig = { ...DEFAULT_STYLE, classoptions: ['12pt'] };
    const frontmatterConfig = { classoptions: ['a4paper'] };

    const result = mergeConfigs(styleConfig, frontmatterConfig);
    // Frontmatter replaces, not merges
    expect(result.classoptions).toEqual(['a4paper']);
  });
});
