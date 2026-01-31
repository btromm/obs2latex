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
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

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
 */
export function parseFrontmatterConfig(frontmatter: string): Partial<StyleConfig> {
  if (!frontmatter.trim()) {
    return {};
  }

  try {
    const parsed = yaml.load(frontmatter) as { latex?: Partial<StyleConfig> };
    return parsed.latex || {};
  } catch {
    return {};
  }
}
