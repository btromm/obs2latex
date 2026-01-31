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
 * Sort files according to order config or alphabetically
 */
function sortFiles(files: FileInput[], order: string[]): FileInput[] {
  if (order.length === 0) {
    return [...files].sort((a, b) => a.name.localeCompare(b.name));
  }

  const orderMap = new Map(order.map((name, idx) => [name, idx]));
  return [...files].sort((a, b) => {
    const aOrder = orderMap.get(a.name) ?? Infinity;
    const bOrder = orderMap.get(b.name) ?? Infinity;
    if (aOrder === bOrder) {
      return a.name.localeCompare(b.name);
    }
    return aOrder - bOrder;
  });
}

/**
 * Export a folder of markdown files to LaTeX
 */
export async function exportFolder(
  files: FileInput[],
  options: MultiExportOptions
): Promise<MultiExportResult> {
  const warnings: string[] = [];
  const sortedFiles = sortFiles(files, options.styleConfig.order);

  // Process each file
  const outputFiles: FileOutput[] = [];

  for (const file of sortedFiles) {
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
    preamble: preamble ? 'has-preamble' : undefined, // Flag to include \input{preamble}
  });

  return {
    mainTex,
    files: outputFiles,
    preamble,
    warnings,
  };
}
