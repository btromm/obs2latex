import { describe, it, expect } from 'vitest';
import { replaceReferencePlaceholders } from './references';

describe('replaceReferencePlaceholders', () => {
  it('replaces EQREF placeholder with eqref', () => {
    const input = 'See {{EQREF:eq-energy}} for the formula.';
    const result = replaceReferencePlaceholders(input);
    expect(result).toBe('See \\eqref{eq-energy} for the formula.');
  });

  it('replaces multiple placeholders', () => {
    const input = 'From {{EQREF:eq-1}} and {{EQREF:eq-2}}.';
    const result = replaceReferencePlaceholders(input);
    expect(result).toBe('From \\eqref{eq-1} and \\eqref{eq-2}.');
  });

  it('handles content without placeholders', () => {
    const input = 'No references here.';
    const result = replaceReferencePlaceholders(input);
    expect(result).toBe('No references here.');
  });
});
