// src/preprocessor/equations.ts

export interface EquationLabel {
  label: string;
  index: number;
}

/**
 * Extract equation labels (^label-name after $$ blocks)
 */
export function extractEquationLabels(content: string): EquationLabel[] {
  const labels: EquationLabel[] = [];
  // Match $$ block followed by ^label on next line
  const pattern = /\$\$[\s\S]*?\$\$\s*\n\^([a-zA-Z0-9-_]+)/g;
  let match;
  let index = 0;

  while ((match = pattern.exec(content)) !== null) {
    labels.push({ label: match[1] ?? '', index: index++ });
  }

  return labels;
}

/**
 * Detect if equation content has an inner environment (align, aligned, etc.)
 */
function detectInnerEnvironment(mathContent: string): string | null {
  const envMatch = mathContent.match(/\\begin\{(align|aligned|gather|gathered|multline)\}/);
  return envMatch ? (envMatch[1] ?? null) : null;
}

/**
 * Process all equations in content, converting to LaTeX format
 */
export function processEquations(content: string): string {
  // Pattern: $$ content $$ optionally followed by ^label
  const pattern = /\$\$([\s\S]*?)\$\$(\s*\n\^([a-zA-Z0-9-_]+))?/g;

  return content.replace(pattern, (match, mathContent: string, labelBlock: string, label: string) => {
    const trimmedMath = mathContent.trim();
    const innerEnv = detectInnerEnvironment(trimmedMath);

    if (innerEnv) {
      // Has inner environment - extract and potentially convert
      let envName = innerEnv;
      let processedMath = trimmedMath;

      // Convert aligned → align (aligned is for nesting, align is standalone)
      if (innerEnv === 'aligned') {
        envName = 'align';
        processedMath = processedMath
          .replace(/\\begin\{aligned\}/, '')
          .replace(/\\end\{aligned\}/, '')
          .trim();
      } else {
        // Remove the inner begin/end, we'll add our own
        processedMath = processedMath
          .replace(new RegExp(`\\\\begin\\{${innerEnv}\\}`), '')
          .replace(new RegExp(`\\\\end\\{${innerEnv}\\}`), '')
          .trim();
      }

      const labelStr = label ? `\\label{${label}}` : '';
      return `\\begin{${envName}}${labelStr}\n${processedMath}\n\\end{${envName}}`;
    } else {
      // Simple equation
      const labelStr = label ? `\\label{${label}}` : '';
      return `\\begin{equation}${labelStr}\n${trimmedMath}\n\\end{equation}`;
    }
  });
}
