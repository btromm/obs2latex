// src/exporter/single.ts
import { preprocess } from '../preprocessor';
import { convertToLatex } from '../pandoc';
import { replaceReferencePlaceholders, assembleDocument } from '../postprocessor';
import { extractFrontmatter, parseFrontmatterConfig, mergeConfigs, type StyleConfig } from '../config';

export interface ExportOptions {
  pandocPath: string;
  styleConfig: StyleConfig;
  fileResolver: (path: string) => Promise<string | null>;
  preambleLoader: (path: string) => Promise<string>;
}

export interface ExportResult {
  latex: string;
  warnings: string[];
}

/**
 * Export a single markdown file to LaTeX
 */
export async function exportSingleFile(
  content: string,
  options: ExportOptions
): Promise<ExportResult> {
  const warnings: string[] = [];

  // 1. Extract frontmatter and merge config
  const { frontmatter, body } = extractFrontmatter(content);
  const frontmatterConfig = parseFrontmatterConfig(frontmatter);
  const config = mergeConfigs(options.styleConfig, frontmatterConfig);

  // 2. Preprocess (callouts, equations, wikilinks, embeds)
  const preprocessed = await preprocess(body, options.fileResolver);

  // Collect warnings from unresolved embeds
  const embedWarnings = preprocessed.match(/% WARNING: Could not resolve .+/g);
  if (embedWarnings) {
    warnings.push(...embedWarnings.map(w => w.replace('% WARNING: ', '')));
  }

  // 3. Convert to LaTeX via Pandoc
  const rawLatex = convertToLatex(preprocessed, options.pandocPath);

  // 4. Post-process (replace reference placeholders)
  const processedLatex = replaceReferencePlaceholders(rawLatex);

  // 5. Load preamble and assemble document
  let preamble = '';
  if (config.preamble) {
    try {
      preamble = await options.preambleLoader(config.preamble);
    } catch {
      warnings.push(`Could not load preamble: ${config.preamble}`);
    }
  }

  const finalLatex = assembleDocument(processedLatex, {
    documentClass: config.documentclass,
    classOptions: config.classoptions,
    preamble,
  });

  return { latex: finalLatex, warnings };
}
