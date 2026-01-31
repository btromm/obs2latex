// src/config/style.ts
import yaml from 'js-yaml';

export interface StyleConfig {
  preamble: string;
  documentclass: string;
  classoptions: string[];
  order: string[];
}

export const DEFAULT_STYLE: StyleConfig = {
  preamble: '',
  documentclass: 'article',
  classoptions: [],
  order: [],
};

/**
 * Parse a style YAML file
 */
export function parseStyleFile(content: string): StyleConfig {
  if (!content.trim()) {
    return { ...DEFAULT_STYLE };
  }

  try {
    const parsed = yaml.load(content) as Partial<StyleConfig>;
    return {
      preamble: parsed.preamble || DEFAULT_STYLE.preamble,
      documentclass: parsed.documentclass || DEFAULT_STYLE.documentclass,
      classoptions: parsed.classoptions || DEFAULT_STYLE.classoptions,
      order: parsed.order || DEFAULT_STYLE.order,
    };
  } catch {
    return { ...DEFAULT_STYLE };
  }
}
