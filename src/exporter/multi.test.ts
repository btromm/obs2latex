// src/exporter/multi.test.ts
import { describe, it, expect, vi } from 'vitest';
import { exportFolder } from './multi';

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue('content'),
}));

describe('exportFolder', () => {
  it('produces main.tex and individual files', async () => {
    const files = [
      { name: 'intro', content: '# Introduction\n\nHello' },
      { name: 'chapter1', content: '# Chapter 1\n\nWorld' },
    ];

    const mockFileResolver = vi.fn().mockResolvedValue(null);
    const mockPreambleLoader = vi.fn().mockResolvedValue('\\usepackage{amsmath}');

    const result = await exportFolder(files, {
      pandocPath: 'pandoc',
      styleConfig: {
        preamble: './preamble.tex',
        documentclass: 'book',
        classoptions: ['12pt'],
        order: [],
      },
      fileResolver: mockFileResolver,
      preambleLoader: mockPreambleLoader,
    });

    expect(result.mainTex).toContain('\\documentclass[12pt]{book}');
    expect(result.mainTex).toContain('\\input{intro}');
    expect(result.mainTex).toContain('\\input{chapter1}');
    expect(result.files).toHaveLength(2);
    expect(result.files[0]?.name).toBe('chapter1');
    expect(result.preamble).toBe('\\usepackage{amsmath}');
  });

  it('respects order from style config', async () => {
    const files = [
      { name: 'chapter1', content: '# Ch1' },
      { name: 'intro', content: '# Intro' },
    ];

    const result = await exportFolder(files, {
      pandocPath: 'pandoc',
      styleConfig: {
        preamble: '',
        documentclass: 'article',
        classoptions: [],
        order: ['intro', 'chapter1'],
      },
      fileResolver: vi.fn().mockResolvedValue(null),
      preambleLoader: vi.fn().mockResolvedValue(''),
    });

    const introIndex = result.mainTex.indexOf('\\input{intro}');
    const ch1Index = result.mainTex.indexOf('\\input{chapter1}');
    expect(introIndex).toBeLessThan(ch1Index);
  });
});
