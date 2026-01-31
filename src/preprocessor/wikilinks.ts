// src/preprocessor/wikilinks.ts

export enum WikilinkType {
  Reference = 'reference',
  Embed = 'embed',
}

export interface ParsedWikilink {
  type: WikilinkType;
  target: string;
  anchor: string | null;
  display: string | null;
}

export function parseWikilink(wikilink: string): ParsedWikilink {
  const isEmbed = wikilink.startsWith('!');
  const inner = wikilink.replace(/^!?\[\[|\]\]$/g, '');

  const parts = inner.split('|').map(s => s.trim());
  const pathPart = parts[0] ?? '';
  const display = parts[1];
  const pathParts = pathPart.split('#');
  const target = pathParts[0] ?? '';
  const anchorPart = pathParts[1];
  const anchor = anchorPart ? anchorPart.replace(/^\^/, '') : null;

  return {
    type: isEmbed ? WikilinkType.Embed : WikilinkType.Reference,
    target: target,
    anchor: anchor,
    display: display || null,
  };
}

export function processWikilinks(content: string): string {
  const pattern = /(!?\[\[[^\]]+\]\])/g;

  return content.replace(pattern, (match) => {
    const parsed = parseWikilink(match);

    if (parsed.type === WikilinkType.Embed) {
      const anchorPart = parsed.anchor ? `#^${parsed.anchor}` : '';
      return `{{EMBED:${parsed.target}${anchorPart}}}`;
    } else {
      if (parsed.anchor) {
        return `{{EQREF:${parsed.anchor}}}`;
      } else {
        return parsed.display || parsed.target;
      }
    }
  });
}
