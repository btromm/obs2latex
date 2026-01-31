// src/pandoc/detector.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findPandoc, isPandocAvailable } from './detector';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';

describe('findPandoc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns custom path if provided and valid', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('pandoc 3.1.0'));
    const result = findPandoc('/custom/pandoc');
    expect(result).toBe('/custom/pandoc');
  });

  it('auto-detects pandoc in PATH', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('pandoc 3.1.0'));
    const result = findPandoc('');
    expect(result).toBe('pandoc');
  });

  it('returns null if pandoc not found', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('not found');
    });
    const result = findPandoc('');
    expect(result).toBeNull();
  });
});

describe('isPandocAvailable', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns true when pandoc exists', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('pandoc 3.1.0'));
    expect(isPandocAvailable('pandoc')).toBe(true);
  });

  it('returns false when pandoc missing', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('not found');
    });
    expect(isPandocAvailable('pandoc')).toBe(false);
  });
});
