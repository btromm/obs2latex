export interface DocumentOptions {
  documentClass?: string;
  classOptions?: string[];
  preamble?: string;
}

export function assembleDocument(body: string, options: DocumentOptions): string {
  const docClass = options.documentClass || 'article';
  const classOpts = options.classOptions?.length
    ? `[${options.classOptions.join(',')}]`
    : '';

  const parts = [
    `\\documentclass${classOpts}{${docClass}}`,
  ];

  if (options.preamble) {
    parts.push(options.preamble);
  }

  parts.push('');
  parts.push('\\begin{document}');
  parts.push('');
  parts.push(body);
  parts.push('');
  parts.push('\\end{document}');

  return parts.join('\n');
}

export function assembleMultiFile(fileNames: string[], options: DocumentOptions): string {
  const docClass = options.documentClass || 'article';
  const classOpts = options.classOptions?.length
    ? `[${options.classOptions.join(',')}]`
    : '';

  const parts = [
    `\\documentclass${classOpts}{${docClass}}`,
  ];

  if (options.preamble) {
    parts.push('\\input{preamble}');
  }

  parts.push('');
  parts.push('\\begin{document}');
  parts.push('');

  for (const name of fileNames) {
    parts.push(`\\input{${name}}`);
  }

  parts.push('');
  parts.push('\\end{document}');

  return parts.join('\n');
}
