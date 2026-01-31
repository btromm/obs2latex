// src/config/index.ts
export { DEFAULT_STYLE, type StyleConfig } from './style';
export { extractFrontmatter, parseFrontmatterConfig } from './frontmatter';

import type { StyleConfig } from './style';

/**
 * Merge style config with frontmatter overrides
 * Frontmatter takes precedence
 */
export function mergeConfigs(
  styleConfig: StyleConfig,
  frontmatterConfig: Partial<StyleConfig>
): StyleConfig {
  return {
    preamble: frontmatterConfig.preamble ?? styleConfig.preamble,
    documentclass: frontmatterConfig.documentclass ?? styleConfig.documentclass,
    classoptions: frontmatterConfig.classoptions ?? styleConfig.classoptions,
  };
}
