import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';

describe('Settings', () => {
  it('has correct default values', () => {
    expect(DEFAULT_SETTINGS.exportFolder).toBe('latex-exports');
    expect(DEFAULT_SETTINGS.defaultPreamble).toBe('');
    expect(DEFAULT_SETTINGS.pandocPath).toBe('');
    expect(DEFAULT_SETTINGS.openAfterExport).toBe(false);
  });
});
