export function replaceReferencePlaceholders(content: string): string {
  // Support both unescaped {{EQREF:label}} and escaped \{\{EQREF:label\}\} (from Pandoc)
  // Also unescape any characters Pandoc might have escaped inside the label (like underscores)
  return content.replace(/(?:\\\{|\{){2}EQREF:(.*?)(?:\\\}|\}){2}/g, (_, label) => {
    const unescapedLabel = label.replace(/\\([_#%$&{}-])/g, '$1');
    return `\\eqref{${unescapedLabel}}`;
  });
}
