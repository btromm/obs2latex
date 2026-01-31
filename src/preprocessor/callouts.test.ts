// src/preprocessor/callouts.test.ts
import { describe, it, expect } from 'vitest';
import { processCallouts, CALLOUT_ENV_MAP } from './callouts';

describe('CALLOUT_ENV_MAP', () => {
  it('maps standard theorem environments', () => {
    expect(CALLOUT_ENV_MAP['theorem']).toBe('theorem');
    expect(CALLOUT_ENV_MAP['lemma']).toBe('lemma');
    expect(CALLOUT_ENV_MAP['proof']).toBe('proof');
    expect(CALLOUT_ENV_MAP['definition']).toBe('definition');
  });
});

describe('processCallouts', () => {
  it('converts theorem callout without title', () => {
    const input = `> [!theorem]
> This is a theorem.`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{theorem}');
    expect(result).toContain('This is a theorem.');
    expect(result).toContain('\\end{theorem}');
  });

  it('converts theorem callout with title', () => {
    const input = `> [!theorem] Pythagorean Theorem
> For a right triangle, a² + b² = c².`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{theorem}[Pythagorean Theorem]');
    expect(result).toContain('For a right triangle');
    expect(result).toContain('\\end{theorem}');
  });

  it('converts proof callout', () => {
    const input = `> [!proof]
> By induction...`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{proof}');
    expect(result).toContain('\\end{proof}');
  });

  it('handles unknown callout with fallback', () => {
    const input = `> [!warning]
> Be careful!`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{notebox}');
    expect(result).toContain('\\end{notebox}');
  });

  it('handles multi-line callout content', () => {
    const input = `> [!definition] Limit
> Let f be a function.
>
> We say that...
>
> More content here.`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{definition}[Limit]');
    expect(result).toContain('Let f be a function.');
    expect(result).toContain('We say that...');
    expect(result).toContain('\\end{definition}');
  });
});
