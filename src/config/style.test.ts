// src/config/style.test.ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_STYLE } from './style';

describe('DEFAULT_STYLE', () => {
  it('has correct default values', () => {
    expect(DEFAULT_STYLE.preamble).toBe('');
    expect(DEFAULT_STYLE.documentclass).toBe('article');
    expect(DEFAULT_STYLE.classoptions).toEqual([]);
  });
});
