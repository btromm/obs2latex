// src/preprocessor/embeds.ts

export function extractBlockContent(content: string, anchor: string): string | null {
  const equationPattern = new RegExp(
    `(\\$\\$[\\s\\S]*?\\$\\$)\\s*\\n\\^${escapeRegex(anchor)}`,
    'm'
  );

  const match = content.match(equationPattern);
  if (match) {
    return match[0];
  }

  return null;
}

export async function resolveAllEmbeds(
  content: string,
  fileResolver: (path: string) => Promise<string | null>
): Promise<string> {
  const embedPattern = /\{\{EMBED:([^}]+)\}\}/g;
  const matches = [...content.matchAll(embedPattern)];

  let result = content;

  for (const match of matches) {
    const [fullMatch, reference] = match;
    const [filePath, anchorPart] = reference.split('#^');

    const fileContent = await fileResolver(filePath);

    if (fileContent && anchorPart) {
      const blockContent = extractBlockContent(fileContent, anchorPart);
      if (blockContent) {
        result = result.replace(fullMatch, escapeReplacement(blockContent));
        continue;
      }
    }

    result = result.replace(fullMatch, `% WARNING: Could not resolve ${reference}`);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeReplacement(str: string): string {
  // Escape $ in replacement strings ($ has special meaning in String.replace)
  return str.replace(/\$/g, '$$$$');
}
