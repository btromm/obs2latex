// src/pandoc/converter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertToLatex } from './converter';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';

describe('convertToLatex', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls pandoc with correct arguments', () => {
    vi.mocked(execSync).mockReturnValue('\\section{Test}');

    convertToLatex('# Test', 'pandoc');

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('pandoc'),
      expect.objectContaining({
        input: expect.any(String),
      })
    );
  });

  it('returns LaTeX output', () => {
    vi.mocked(execSync).mockReturnValue('\\section{Hello}\n\nWorld');

    const result = convertToLatex('# Hello\n\nWorld', 'pandoc');

    expect(result).toContain('\\section{Hello}');
    expect(result).toContain('World');
  });

  it('throws on pandoc error', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('pandoc error');
    });

    expect(() => convertToLatex('test', 'pandoc')).toThrow();
  });
});
