// src/exporter/single.test.ts
import { describe, it, expect, vi } from 'vitest';
import { exportSingleFile } from './single';

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue('\\section{Test}'),
}));

describe('exportSingleFile', () => {
  it('produces complete export result', async () => {
    const content = `---
documentclass: article
---

# My Note

> [!theorem] Main
> Content

$$
E = mc^2
$$
^eq-energy

See [[#^eq-energy|Eq 1]].`;

    const mockFileResolver = vi.fn().mockResolvedValue(null);
    const mockPreambleLoader = vi.fn().mockResolvedValue('\\usepackage{amsmath}');

    const result = await exportSingleFile(content, {
      pandocPath: 'pandoc',
      styleConfig: {
        preamble: './preamble.tex',
        documentclass: 'article',
        classoptions: [],
      },
      fileResolver: mockFileResolver,
      preambleLoader: mockPreambleLoader,
    });

    expect(result.latex).toContain('\\documentclass');
    expect(result.latex).toContain('\\begin{document}');
    expect(result.latex).toContain('\\end{document}');
    expect(result.warnings).toEqual([]);
  });

  it('correctly replaces escaped EQREF in the final output', async () => {
    const { execSync } = await import('child_process');
    vi.mocked(execSync).mockReturnValueOnce('See \\{\\{EQREF:reward-standard\\}\\} for details.');

    const content = 'See [[#^reward-standard]].';
    const result = await exportSingleFile(content, {
      pandocPath: 'pandoc',
      styleConfig: { documentclass: 'article', classoptions: [] },
      fileResolver: vi.fn(),
      preambleLoader: vi.fn().mockResolvedValue(''),
    });

    expect(result.latex).toContain('See \\eqref{reward-standard} for details.');
  });
});
