import { describe, it, expect } from 'vitest';
import { assembleDocument, assembleMultiFile } from './assembler';

describe('assembleDocument', () => {
  it('creates standalone document with preamble', () => {
    const body = '\\section{Hello}\n\nWorld';
    const preamble = '\\usepackage{amsmath}';
    const result = assembleDocument(body, {
      preamble,
      documentClass: 'article',
      classOptions: ['12pt'],
    });

    expect(result).toContain('\\documentclass[12pt]{article}');
    expect(result).toContain('\\usepackage{amsmath}');
    expect(result).toContain('\\begin{document}');
    expect(result).toContain('\\section{Hello}');
    expect(result).toContain('\\end{document}');
  });

  it('uses default document class', () => {
    const result = assembleDocument('content', {});
    expect(result).toContain('\\documentclass{article}');
  });
});

describe('assembleMultiFile', () => {
  it('creates main file with inputs', () => {
    const files = ['intro', 'chapter1', 'chapter2'];
    const result = assembleMultiFile(files, {
      documentClass: 'book',
      preamble: '\\usepackage{amsthm}',
    });

    expect(result).toContain('\\documentclass{book}');
    expect(result).toContain('\\input{intro}');
    expect(result).toContain('\\input{chapter1}');
    expect(result).toContain('\\input{chapter2}');
  });
});
