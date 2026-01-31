// src/preprocessor/equations.test.ts
import { describe, it, expect } from 'vitest';
import { extractEquationLabels, processEquations } from './equations';

describe('extractEquationLabels', () => {
  it('extracts label after display math block', () => {
    const input = `Some text
$$
E = mc^2
$$
^eq-energy

More text`;
    const labels = extractEquationLabels(input);
    expect(labels).toEqual([{ label: 'eq-energy', index: 0 }]);
  });

  it('extracts multiple labels', () => {
    const input = `$$
x = 1
$$
^eq-first

$$
y = 2
$$
^eq-second`;
    const labels = extractEquationLabels(input);
    expect(labels).toHaveLength(2);
    expect(labels[0].label).toBe('eq-first');
    expect(labels[1].label).toBe('eq-second');
  });
});

describe('processEquations', () => {
  it('converts simple equation with label to LaTeX', () => {
    const input = `$$
E = mc^2
$$
^eq-energy`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{equation}\\label{eq-energy}');
    expect(result).toContain('E = mc^2');
    expect(result).toContain('\\end{equation}');
    expect(result).not.toContain('^eq-energy');
  });

  it('detects inner align environment', () => {
    const input = `$$
\\begin{align}
x &= 1 \\\\
y &= 2
\\end{align}
$$
^eq-system`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{align}\\label{eq-system}');
    expect(result).not.toContain('\\begin{equation}');
  });

  it('converts aligned to align', () => {
    const input = `$$
\\begin{aligned}
x &= 1
\\end{aligned}
$$
^eq-aligned`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{align}\\label{eq-aligned}');
    expect(result).toContain('\\end{align}');
    expect(result).not.toContain('\\begin{aligned}');
    expect(result).not.toContain('\\end{aligned}');
  });

  it('handles equation without label', () => {
    const input = `$$
x = 1
$$`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{equation}');
    expect(result).not.toContain('\\label');
  });
});
