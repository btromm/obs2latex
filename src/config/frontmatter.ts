// src/config/frontmatter.ts
import yaml from 'js-yaml';
import type { StyleConfig } from './style';

export interface FrontmatterResult {
  frontmatter: string;
  body: string;
}

/**
 * Extract YAML frontmatter from markdown content
 */
export function extractFrontmatter(content: string): FrontmatterResult {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/);

  if (match) {
    return {
      frontmatter: match[1] ?? '',
      body: match[2] ?? '',
    };
  }

  return {
    frontmatter: '',
    body: content,
  };
}

/**
 * Parse latex configuration from frontmatter YAML
 * Reads documentclass, classoptions, preamble as top-level properties
 */
export function parseFrontmatterConfig(frontmatter: string): Partial<StyleConfig> {
  if (!frontmatter.trim()) {
    return {};
  }

  try {
    const parsed = yaml.load(frontmatter) as Record<string, unknown>;
    const config: Partial<StyleConfig> = {};

    if (typeof parsed.documentclass === 'string') {
      config.documentclass = parsed.documentclass;
    }
    if (Array.isArray(parsed.classoptions)) {
      config.classoptions = parsed.classoptions as string[];
    }
    if (typeof parsed.preamble === 'string') {
      config.preamble = parsed.preamble;
    }

    return config;
  } catch {
    return {};
  }
}
