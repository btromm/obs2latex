// src/preprocessor/callouts.ts

export const CALLOUT_ENV_MAP: Record<string, string> = {
  theorem: 'theorem',
  lemma: 'lemma',
  proposition: 'proposition',
  corollary: 'corollary',
  definition: 'definition',
  proof: 'proof',
  remark: 'remark',
  example: 'example',
  exercise: 'exercise',
};

const FALLBACK_ENV = 'notebox';

export function processCallouts(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const calloutMatch = line.match(/^>\s*\[!([^\]]+)\]\s*(.*)$/);

    if (calloutMatch) {
      const calloutType = calloutMatch[1].toLowerCase();
      const title = calloutMatch[2].trim();
      const envName = CALLOUT_ENV_MAP[calloutType] || FALLBACK_ENV;

      const contentLines: string[] = [];
      i++;

      while (i < lines.length && lines[i].startsWith('>')) {
        const contentLine = lines[i].replace(/^>\s?/, '');
        contentLines.push(contentLine);
        i++;
      }

      const titlePart = title ? `[${title}]` : '';
      result.push(`\\begin{${envName}}${titlePart}`);
      result.push(contentLines.join('\n').trim());
      result.push(`\\end{${envName}}`);
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}
