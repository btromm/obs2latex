// src/pandoc/converter.ts
import { execSync } from 'child_process';

export interface ConvertOptions {
  documentClass?: string;
  standalone?: boolean;
}

export function convertToLatex(
  markdown: string,
  pandocPath: string,
  options: ConvertOptions = {}
): string {
  const args = [
    '-f', 'markdown',
    '-t', 'latex',
    '--wrap=preserve',
  ];

  if (options.standalone) {
    args.push('-s');
    if (options.documentClass) {
      args.push('-V', `documentclass=${options.documentClass}`);
    }
  }

  const command = `"${pandocPath}" ${args.join(' ')}`;

  try {
    const output = execSync(command, {
      input: markdown,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Pandoc conversion failed: ${message}`);
  }
}
