// src/preprocessor/index.test.ts
import { describe, it, expect, vi } from 'vitest';
import { preprocess } from './index';

describe('preprocess', () => {
  it('processes equations, callouts, and wikilinks together', async () => {
    const input = `# My Note

> [!theorem] Main Result
> For all x, we have equation [[#^eq-main|Eq 1]].

$$
f(x) = x^2
$$
^eq-main

See also ![[Other#^eq-2]].`;

    const mockResolver = vi.fn().mockResolvedValue(null);
    const result = await preprocess(input, mockResolver);

    // Callout converted
    expect(result).toContain('\\begin{theorem}[Main Result]');
    expect(result).toContain('\\end{theorem}');

    // Equation processed
    expect(result).toContain('\\begin{equation}\\label{eq-main}');

    // Wikilink converted to placeholder
    expect(result).toContain('{{EQREF:eq-main}}');

    // Embed attempted (will fail with mock)
    expect(result).toContain('% WARNING: Could not resolve Other#^eq-2');
  });
});
