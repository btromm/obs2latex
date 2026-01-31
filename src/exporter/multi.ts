// src/exporter/multi.ts
import { preprocess } from '../preprocessor';
import { convertToLatex } from '../pandoc';
import { replaceReferencePlaceholders, assembleMultiFile } from '../postprocessor';
import type { StyleConfig } from '../config';

export interface FileInput {
  name: string;
  content: string;
}

export interface FileOutput {
  name: string;
  latex: string;
}

export interface MultiExportOptions {
  pandocPath: string;
  styleConfig: StyleConfig;
  fileResolver: (path: string) => Promise<string | null>;
  preambleLoader: (path: string) => Promise<string>;
}

export interface MultiExportResult {
  mainTex: string;
  files: FileOutput[];
  preamble: string;
  warnings: string[];
}

/**
 * Export a folder of markdown files to LaTeX
 * Files are processed in the order provided (caller should sort if needed)
 */
export async function exportFolder(
  files: FileInput[],
  options: MultiExportOptions
): Promise<MultiExportResult> {
  const warnings: string[] = [];

  // Process each file
  const outputFiles: FileOutput[] = [];

  for (const file of files) {
    // Preprocess
    const preprocessed = await preprocess(file.content, options.fileResolver);

    // Collect warnings
    const embedWarnings = preprocessed.match(/% WARNING: Could not resolve .+/g);
    if (embedWarnings) {
      warnings.push(...embedWarnings.map(w => `${file.name}: ${w.replace('% WARNING: ', '')}`));
    }

    // Convert via Pandoc (not standalone - will be included)
    const rawLatex = convertToLatex(preprocessed, options.pandocPath, { standalone: false });

    // Post-process
    const processedLatex = replaceReferencePlaceholders(rawLatex);

    outputFiles.push({
      name: file.name,
      latex: processedLatex,
    });
  }

  // Load preamble
  let preamble = '';
  if (options.styleConfig.preamble) {
    try {
      preamble = await options.preambleLoader(options.styleConfig.preamble);
    } catch {
      warnings.push(`Could not load preamble: ${options.styleConfig.preamble}`);
    }
  }

  // Generate main.tex
  const fileNames = outputFiles.map(f => f.name);
  const mainTex = assembleMultiFile(fileNames, {
    documentClass: options.styleConfig.documentclass,
    classOptions: options.styleConfig.classoptions,
    preamble: preamble ? 'has-preamble' : undefined,
  });

  return {
    mainTex,
    files: outputFiles,
    preamble,
    warnings,
  };
}
