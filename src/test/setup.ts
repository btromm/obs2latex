// src/test/setup.ts
// Mock Obsidian API for unit tests
export const mockApp = {
  vault: {
    getAbstractFileByPath: vi.fn(),
    read: vi.fn(),
    adapter: {
      exists: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      mkdir: vi.fn(),
    },
  },
  metadataCache: {
    getFileCache: vi.fn(),
  },
};
