export function replaceReferencePlaceholders(content: string): string {
  return content.replace(/\{\{EQREF:([^}]+)\}\}/g, '\\eqref{$1}');
}
