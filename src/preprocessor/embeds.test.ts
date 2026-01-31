// src/preprocessor/embeds.test.ts
import { describe, it, expect, vi } from 'vitest';
import { resolveAllEmbeds, extractBlockContent } from './embeds';

describe('extractBlockContent', () => {
  it('extracts equation block by anchor', () => {
    const content = `Some text

$$
E = mc^2
$$
^eq-energy

More text`;

    const result = extractBlockContent(content, 'eq-energy');
    expect(result).toContain('$$');
    expect(result).toContain('E = mc^2');
  });

  it('returns null for missing anchor', () => {
    const content = 'No anchors here';
    const result = extractBlockContent(content, 'missing');
    expect(result).toBeNull();
  });
});

describe('resolveAllEmbeds', () => {
  it('replaces embed placeholder with content', async () => {
    const input = 'Here is the equation:\n{{EMBED:Note#^eq-1}}\nContinuing...';
    const mockResolver = vi.fn().mockResolvedValue('$$\nx = 1\n$$\n^eq-1');

    const result = await resolveAllEmbeds(input, mockResolver);
    expect(result).toContain('$$');
    expect(result).toContain('x = 1');
    expect(result).not.toContain('{{EMBED');
  });

  it('adds warning comment for unresolved embed', async () => {
    const input = '{{EMBED:Missing#^eq-1}}';
    const mockResolver = vi.fn().mockResolvedValue(null);

    const result = await resolveAllEmbeds(input, mockResolver);
    expect(result).toContain('% WARNING: Could not resolve Missing#^eq-1');
  });
});
