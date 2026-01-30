# obs2latex Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Obsidian plugin that converts Obsidian Markdown to LaTeX with proper cross-references, equation handling, and environment support.

**Architecture:** Three-stage pipeline - TypeScript preprocessor handles Obsidian-specific syntax (wikilinks, embeds, callouts), Pandoc converts to LaTeX via child process with custom Lua filter, TypeScript post-processor assembles final output.

**Tech Stack:** TypeScript, Obsidian API, Pandoc (external), Lua filters, Vitest for testing

---

## Phase 1: Foundation

### Task 1.1: Set Up Testing Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`

**Step 1: Add vitest and dependencies to package.json**

Add to `devDependencies` in `package.json`:
```json
"vitest": "^1.6.0",
"@vitest/coverage-v8": "^1.6.0"
```

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
});
```

**Step 3: Create test setup file**

```typescript
// src/test/setup.ts
// Mock Obsidian API for unit tests
export const mockApp = {
  vault: {
    getAbstractFileByPath: vi.fn(),
    read: vi.fn(),
    adapter: {
      exists: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      mkdir: vi.fn(),
    },
  },
  metadataCache: {
    getFileCache: vi.fn(),
  },
};
```

**Step 4: Update tsconfig.json for vitest**

Add to `compilerOptions`:
```json
"types": ["vitest/globals"]
```

**Step 5: Install dependencies and verify**

Run: `npm install`
Run: `npm test`
Expected: No tests found (passes with 0 tests)

**Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json tsconfig.json
git commit -m "chore: add vitest testing infrastructure"
```

---

### Task 1.2: Clean Up Boilerplate and Create Settings

**Files:**
- Modify: `src/main.ts`
- Modify: `src/settings.ts`

**Step 1: Write failing test for settings defaults**

Create `src/settings.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, Obs2LatexSettings } from './settings';

describe('Settings', () => {
  it('has correct default values', () => {
    expect(DEFAULT_SETTINGS.exportFolder).toBe('latex-exports');
    expect(DEFAULT_SETTINGS.defaultStyleFile).toBe('');
    expect(DEFAULT_SETTINGS.pandocPath).toBe('');
    expect(DEFAULT_SETTINGS.openAfterExport).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - exportFolder property doesn't exist

**Step 3: Update settings.ts with proper interface**

```typescript
import { App, PluginSettingTab, Setting } from "obsidian";
import type Obs2LatexPlugin from "./main";

export interface Obs2LatexSettings {
  exportFolder: string;
  defaultStyleFile: string;
  pandocPath: string;
  openAfterExport: boolean;
}

export const DEFAULT_SETTINGS: Obs2LatexSettings = {
  exportFolder: 'latex-exports',
  defaultStyleFile: '',
  pandocPath: '',
  openAfterExport: false,
};

export class Obs2LatexSettingTab extends PluginSettingTab {
  plugin: Obs2LatexPlugin;

  constructor(app: App, plugin: Obs2LatexPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'obs2latex Settings' });

    new Setting(containerEl)
      .setName('Export folder')
      .setDesc('Folder where LaTeX files will be exported (relative to vault root)')
      .addText(text => text
        .setPlaceholder('latex-exports')
        .setValue(this.plugin.settings.exportFolder)
        .onChange(async (value) => {
          this.plugin.settings.exportFolder = value || 'latex-exports';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Default style file')
      .setDesc('Path to default style YAML file (optional)')
      .addText(text => text
        .setPlaceholder('path/to/style.yaml')
        .setValue(this.plugin.settings.defaultStyleFile)
        .onChange(async (value) => {
          this.plugin.settings.defaultStyleFile = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Pandoc path')
      .setDesc('Path to Pandoc executable (leave empty for auto-detect)')
      .addText(text => text
        .setPlaceholder('Auto-detect')
        .setValue(this.plugin.settings.pandocPath)
        .onChange(async (value) => {
          this.plugin.settings.pandocPath = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Open after export')
      .setDesc('Open the exported .tex file in default application')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.openAfterExport)
        .onChange(async (value) => {
          this.plugin.settings.openAfterExport = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Update main.ts**

```typescript
import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, Obs2LatexSettings, Obs2LatexSettingTab } from "./settings";

export default class Obs2LatexPlugin extends Plugin {
  settings: Obs2LatexSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new Obs2LatexSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

**Step 6: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

**Step 7: Commit**

```bash
git add src/main.ts src/settings.ts src/settings.test.ts
git commit -m "feat: add plugin settings for export folder, style file, pandoc path"
```

---

## Phase 2: Core Preprocessor

### Task 2.1: Equation Label Extraction

**Files:**
- Create: `src/preprocessor/equations.ts`
- Create: `src/preprocessor/equations.test.ts`

**Step 1: Write failing test for equation label extraction**

```typescript
// src/preprocessor/equations.test.ts
import { describe, it, expect } from 'vitest';
import { extractEquationLabels, processEquations } from './equations';

describe('extractEquationLabels', () => {
  it('extracts label after display math block', () => {
    const input = `Some text
$$
E = mc^2
$$
^eq-energy

More text`;
    const labels = extractEquationLabels(input);
    expect(labels).toEqual([{ label: 'eq-energy', index: 0 }]);
  });

  it('extracts multiple labels', () => {
    const input = `$$
x = 1
$$
^eq-first

$$
y = 2
$$
^eq-second`;
    const labels = extractEquationLabels(input);
    expect(labels).toHaveLength(2);
    expect(labels[0].label).toBe('eq-first');
    expect(labels[1].label).toBe('eq-second');
  });
});

describe('processEquations', () => {
  it('converts simple equation with label to LaTeX', () => {
    const input = `$$
E = mc^2
$$
^eq-energy`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{equation}\\label{eq-energy}');
    expect(result).toContain('E = mc^2');
    expect(result).toContain('\\end{equation}');
    expect(result).not.toContain('^eq-energy');
  });

  it('detects inner align environment', () => {
    const input = `$$
\\begin{align}
x &= 1 \\\\
y &= 2
\\end{align}
$$
^eq-system`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{align}\\label{eq-system}');
    expect(result).not.toContain('\\begin{equation}');
  });

  it('converts aligned to align', () => {
    const input = `$$
\\begin{aligned}
x &= 1
\\end{aligned}
$$
^eq-aligned`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{align}\\label{eq-aligned}');
    expect(result).toContain('\\end{align}');
    expect(result).not.toContain('aligned');
  });

  it('handles equation without label', () => {
    const input = `$$
x = 1
$$`;
    const result = processEquations(input);
    expect(result).toContain('\\begin{equation}');
    expect(result).not.toContain('\\label');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create equations.ts with implementation**

```typescript
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
    labels.push({ label: match[1], index: index++ });
  }

  return labels;
}

/**
 * Detect if equation content has an inner environment (align, aligned, etc.)
 */
function detectInnerEnvironment(mathContent: string): string | null {
  const envMatch = mathContent.match(/\\begin\{(align|aligned|gather|gathered|multline)\}/);
  return envMatch ? envMatch[1] : null;
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
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preprocessor/equations.ts src/preprocessor/equations.test.ts
git commit -m "feat: add equation label extraction and processing"
```

---

### Task 2.2: Callout to Environment Conversion

**Files:**
- Create: `src/preprocessor/callouts.ts`
- Create: `src/preprocessor/callouts.test.ts`

**Step 1: Write failing test for callout conversion**

```typescript
// src/preprocessor/callouts.test.ts
import { describe, it, expect } from 'vitest';
import { processCallouts, CALLOUT_ENV_MAP } from './callouts';

describe('CALLOUT_ENV_MAP', () => {
  it('maps standard theorem environments', () => {
    expect(CALLOUT_ENV_MAP['theorem']).toBe('theorem');
    expect(CALLOUT_ENV_MAP['lemma']).toBe('lemma');
    expect(CALLOUT_ENV_MAP['proof']).toBe('proof');
    expect(CALLOUT_ENV_MAP['definition']).toBe('definition');
  });
});

describe('processCallouts', () => {
  it('converts theorem callout without title', () => {
    const input = `> [!theorem]
> This is a theorem.`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{theorem}');
    expect(result).toContain('This is a theorem.');
    expect(result).toContain('\\end{theorem}');
  });

  it('converts theorem callout with title', () => {
    const input = `> [!theorem] Pythagorean Theorem
> For a right triangle, a² + b² = c².`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{theorem}[Pythagorean Theorem]');
    expect(result).toContain('For a right triangle');
    expect(result).toContain('\\end{theorem}');
  });

  it('converts proof callout', () => {
    const input = `> [!proof]
> By induction...`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{proof}');
    expect(result).toContain('\\end{proof}');
  });

  it('handles unknown callout with fallback', () => {
    const input = `> [!warning]
> Be careful!`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{notebox}');
    expect(result).toContain('\\end{notebox}');
  });

  it('handles multi-line callout content', () => {
    const input = `> [!definition] Limit
> Let f be a function.
>
> We say that...
>
> More content here.`;
    const result = processCallouts(input);
    expect(result).toContain('\\begin{definition}[Limit]');
    expect(result).toContain('Let f be a function.');
    expect(result).toContain('We say that...');
    expect(result).toContain('\\end{definition}');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create callouts.ts with implementation**

```typescript
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

/**
 * Process Obsidian callouts and convert to LaTeX environments
 */
export function processCallouts(content: string): string {
  // Match callout blocks: > [!type] optional title followed by > lines
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

      // Collect callout content
      const contentLines: string[] = [];
      i++;

      while (i < lines.length && lines[i].startsWith('>')) {
        // Remove the leading > and optional space
        const contentLine = lines[i].replace(/^>\s?/, '');
        contentLines.push(contentLine);
        i++;
      }

      // Build LaTeX environment
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
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preprocessor/callouts.ts src/preprocessor/callouts.test.ts
git commit -m "feat: add callout to LaTeX environment conversion"
```

---

### Task 2.3: Wikilink Reference Parsing

**Files:**
- Create: `src/preprocessor/wikilinks.ts`
- Create: `src/preprocessor/wikilinks.test.ts`

**Step 1: Write failing test for wikilink parsing**

```typescript
// src/preprocessor/wikilinks.test.ts
import { describe, it, expect } from 'vitest';
import { parseWikilink, processWikilinks, WikilinkType } from './wikilinks';

describe('parseWikilink', () => {
  it('parses simple wikilink', () => {
    const result = parseWikilink('[[Note]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: 'Note',
      anchor: null,
      display: null,
    });
  });

  it('parses wikilink with anchor', () => {
    const result = parseWikilink('[[Note#^eq-1]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: 'Note',
      anchor: 'eq-1',
      display: null,
    });
  });

  it('parses wikilink with display text', () => {
    const result = parseWikilink('[[Note#^eq-1|Equation 1]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: 'Note',
      anchor: 'eq-1',
      display: 'Equation 1',
    });
  });

  it('parses embed wikilink', () => {
    const result = parseWikilink('![[Note#^eq-1]]');
    expect(result).toEqual({
      type: WikilinkType.Embed,
      target: 'Note',
      anchor: 'eq-1',
      display: null,
    });
  });

  it('parses same-file anchor reference', () => {
    const result = parseWikilink('[[#^eq-local|Eq 5]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: '',
      anchor: 'eq-local',
      display: 'Eq 5',
    });
  });
});

describe('processWikilinks', () => {
  it('converts equation reference to placeholder', () => {
    const input = 'See [[Note#^eq-energy|Equation 1]] for details.';
    const result = processWikilinks(input);
    expect(result).toContain('{{EQREF:eq-energy}}');
    expect(result).not.toContain('[[');
  });

  it('marks embeds for later resolution', () => {
    const input = 'The equation is: ![[Note#^eq-energy]]';
    const result = processWikilinks(input);
    expect(result).toContain('{{EMBED:Note#^eq-energy}}');
  });

  it('handles multiple wikilinks', () => {
    const input = 'From [[A#^eq-1|Eq 1]] and [[B#^eq-2|Eq 2]].';
    const result = processWikilinks(input);
    expect(result).toContain('{{EQREF:eq-1}}');
    expect(result).toContain('{{EQREF:eq-2}}');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create wikilinks.ts with implementation**

```typescript
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

/**
 * Parse a single wikilink string
 */
export function parseWikilink(wikilink: string): ParsedWikilink {
  const isEmbed = wikilink.startsWith('!');
  const inner = wikilink.replace(/^!?\[\[|\]\]$/g, '');

  // Split by | for display text
  const [pathPart, display] = inner.split('|').map(s => s.trim());

  // Split by # for anchor
  const [target, anchorPart] = pathPart.split('#');

  // Remove ^ prefix from anchor if present
  const anchor = anchorPart ? anchorPart.replace(/^\^/, '') : null;

  return {
    type: isEmbed ? WikilinkType.Embed : WikilinkType.Reference,
    target: target,
    anchor: anchor,
    display: display || null,
  };
}

/**
 * Process all wikilinks in content, converting to placeholders
 * References become {{EQREF:label}}
 * Embeds become {{EMBED:target#^anchor}}
 */
export function processWikilinks(content: string): string {
  // Match both [[...]] and ![[...]]
  const pattern = /(!?\[\[[^\]]+\]\])/g;

  return content.replace(pattern, (match) => {
    const parsed = parseWikilink(match);

    if (parsed.type === WikilinkType.Embed) {
      // Preserve full path for embed resolution
      const anchorPart = parsed.anchor ? `#^${parsed.anchor}` : '';
      return `{{EMBED:${parsed.target}${anchorPart}}}`;
    } else {
      // For references, we only need the anchor for \eqref
      if (parsed.anchor) {
        return `{{EQREF:${parsed.anchor}}}`;
      } else {
        // Non-anchor wikilinks - convert to plain text or hyperref
        return parsed.display || parsed.target;
      }
    }
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preprocessor/wikilinks.ts src/preprocessor/wikilinks.test.ts
git commit -m "feat: add wikilink parsing and placeholder conversion"
```

---

### Task 2.4: Embed Resolution

**Files:**
- Create: `src/preprocessor/embeds.ts`
- Create: `src/preprocessor/embeds.test.ts`

**Step 1: Write failing test for embed resolution**

```typescript
// src/preprocessor/embeds.test.ts
import { describe, it, expect, vi } from 'vitest';
import { resolveEmbed, resolveAllEmbeds, extractBlockContent } from './embeds';

describe('extractBlockContent', () => {
  it('extracts equation block by anchor', () => {
    const content = `Some text

$$
E = mc^2
$$
^eq-energy

More text`;

    const result = extractBlockContent(content, 'eq-energy');
    expect(result).toContain('$$');
    expect(result).toContain('E = mc^2');
  });

  it('returns null for missing anchor', () => {
    const content = 'No anchors here';
    const result = extractBlockContent(content, 'missing');
    expect(result).toBeNull();
  });
});

describe('resolveAllEmbeds', () => {
  it('replaces embed placeholder with content', async () => {
    const input = 'Here is the equation:\n{{EMBED:Note#^eq-1}}\nContinuing...';
    const mockResolver = vi.fn().mockResolvedValue('$$\nx = 1\n$$\n^eq-1');

    const result = await resolveAllEmbeds(input, mockResolver);
    expect(result).toContain('$$');
    expect(result).toContain('x = 1');
    expect(result).not.toContain('{{EMBED');
  });

  it('adds warning comment for unresolved embed', async () => {
    const input = '{{EMBED:Missing#^eq-1}}';
    const mockResolver = vi.fn().mockResolvedValue(null);

    const result = await resolveAllEmbeds(input, mockResolver);
    expect(result).toContain('% WARNING: Could not resolve Missing#^eq-1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create embeds.ts with implementation**

```typescript
// src/preprocessor/embeds.ts

/**
 * Extract content for a specific block anchor from file content
 */
export function extractBlockContent(content: string, anchor: string): string | null {
  // Find the block ending with ^anchor
  // For equations: $$ ... $$ followed by ^anchor
  const equationPattern = new RegExp(
    `(\\$\\$[\\s\\S]*?\\$\\$)\\s*\\n\\^${escapeRegex(anchor)}`,
    'm'
  );

  const match = content.match(equationPattern);
  if (match) {
    return match[0]; // Return full match including anchor
  }

  // TODO: Support other block types (paragraphs, lists, etc.)
  return null;
}

/**
 * Resolve all embed placeholders in content
 * @param content Content with {{EMBED:target#^anchor}} placeholders
 * @param fileResolver Function to fetch file content by path
 */
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
        result = result.replace(fullMatch, blockContent);
        continue;
      }
    }

    // Could not resolve - add warning comment
    result = result.replace(fullMatch, `% WARNING: Could not resolve ${reference}`);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preprocessor/embeds.ts src/preprocessor/embeds.test.ts
git commit -m "feat: add embed resolution for cross-file equation embedding"
```

---

### Task 2.5: Preprocessor Pipeline

**Files:**
- Create: `src/preprocessor/index.ts`
- Create: `src/preprocessor/index.test.ts`

**Step 1: Write failing test for full preprocessor pipeline**

```typescript
// src/preprocessor/index.test.ts
import { describe, it, expect, vi } from 'vitest';
import { preprocess } from './index';

describe('preprocess', () => {
  it('processes equations, callouts, and wikilinks together', async () => {
    const input = `# My Note

> [!theorem] Main Result
> For all x, we have equation [[#^eq-main|Eq 1]].

$$
f(x) = x^2
$$
^eq-main

See also ![[Other#^eq-2]].`;

    const mockResolver = vi.fn().mockResolvedValue(null);
    const result = await preprocess(input, mockResolver);

    // Callout converted
    expect(result).toContain('\\begin{theorem}[Main Result]');
    expect(result).toContain('\\end{theorem}');

    // Equation processed
    expect(result).toContain('\\begin{equation}\\label{eq-main}');

    // Wikilink converted to placeholder
    expect(result).toContain('{{EQREF:eq-main}}');

    // Embed attempted (will fail with mock)
    expect(result).toContain('% WARNING: Could not resolve Other#^eq-2');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create index.ts combining all preprocessor modules**

```typescript
// src/preprocessor/index.ts
import { processEquations } from './equations';
import { processCallouts } from './callouts';
import { processWikilinks } from './wikilinks';
import { resolveAllEmbeds } from './embeds';

export { extractEquationLabels, processEquations } from './equations';
export { processCallouts, CALLOUT_ENV_MAP } from './callouts';
export { parseWikilink, processWikilinks, WikilinkType } from './wikilinks';
export { extractBlockContent, resolveAllEmbeds } from './embeds';

/**
 * Full preprocessing pipeline
 * Order matters: embeds first (to pull in content), then process everything
 */
export async function preprocess(
  content: string,
  fileResolver: (path: string) => Promise<string | null>
): Promise<string> {
  // 1. Process wikilinks to placeholders (before embeds, so we don't process embed content twice)
  let result = processWikilinks(content);

  // 2. Resolve embeds (pulls in external content)
  result = await resolveAllEmbeds(result, fileResolver);

  // 3. Process callouts to LaTeX environments
  result = processCallouts(result);

  // 4. Process equations (labels, align detection)
  result = processEquations(result);

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/preprocessor/index.ts src/preprocessor/index.test.ts
git commit -m "feat: add unified preprocessor pipeline"
```

---

## Phase 3: Pandoc Integration

### Task 3.1: Pandoc Detection

**Files:**
- Create: `src/pandoc/detector.ts`
- Create: `src/pandoc/detector.test.ts`

**Step 1: Write failing test for Pandoc detection**

```typescript
// src/pandoc/detector.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findPandoc, isPandocAvailable } from './detector';

// We'll mock child_process for these tests
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';

describe('findPandoc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns custom path if provided and valid', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('pandoc 3.1.0'));
    const result = findPandoc('/custom/pandoc');
    expect(result).toBe('/custom/pandoc');
  });

  it('auto-detects pandoc in PATH', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('pandoc 3.1.0'));
    const result = findPandoc('');
    expect(result).toBe('pandoc');
  });

  it('returns null if pandoc not found', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('not found');
    });
    const result = findPandoc('');
    expect(result).toBeNull();
  });
});

describe('isPandocAvailable', () => {
  it('returns true when pandoc exists', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('pandoc 3.1.0'));
    expect(isPandocAvailable('pandoc')).toBe(true);
  });

  it('returns false when pandoc missing', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('not found');
    });
    expect(isPandocAvailable('pandoc')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create detector.ts**

```typescript
// src/pandoc/detector.ts
import { execSync } from 'child_process';

/**
 * Check if pandoc is available at the given path
 */
export function isPandocAvailable(pandocPath: string): boolean {
  try {
    execSync(`"${pandocPath}" --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Find pandoc executable
 * @param customPath User-specified path (empty for auto-detect)
 * @returns Path to pandoc or null if not found
 */
export function findPandoc(customPath: string): string | null {
  // Try custom path first
  if (customPath && isPandocAvailable(customPath)) {
    return customPath;
  }

  // Try system PATH
  if (isPandocAvailable('pandoc')) {
    return 'pandoc';
  }

  // Common installation locations
  const commonPaths = [
    '/usr/local/bin/pandoc',
    '/opt/homebrew/bin/pandoc',
    '/usr/bin/pandoc',
  ];

  for (const path of commonPaths) {
    if (isPandocAvailable(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Get pandoc version string
 */
export function getPandocVersion(pandocPath: string): string | null {
  try {
    const output = execSync(`"${pandocPath}" --version`, { stdio: 'pipe' });
    const firstLine = output.toString().split('\n')[0];
    return firstLine.trim();
  } catch {
    return null;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pandoc/detector.ts src/pandoc/detector.test.ts
git commit -m "feat: add pandoc detection and path resolution"
```

---

### Task 3.2: Pandoc Conversion

**Files:**
- Create: `src/pandoc/converter.ts`
- Create: `src/pandoc/converter.test.ts`

**Step 1: Write failing test for Pandoc conversion**

```typescript
// src/pandoc/converter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertToLatex } from './converter';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';

describe('convertToLatex', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls pandoc with correct arguments', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('\\section{Test}'));

    convertToLatex('# Test', 'pandoc');

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('pandoc'),
      expect.objectContaining({
        input: expect.any(String),
      })
    );
  });

  it('returns LaTeX output', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from('\\section{Hello}\n\nWorld'));

    const result = convertToLatex('# Hello\n\nWorld', 'pandoc');

    expect(result).toContain('\\section{Hello}');
    expect(result).toContain('World');
  });

  it('throws on pandoc error', () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('pandoc error');
    });

    expect(() => convertToLatex('test', 'pandoc')).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create converter.ts**

```typescript
// src/pandoc/converter.ts
import { execSync } from 'child_process';

export interface ConvertOptions {
  /** Document class (article, book, report) */
  documentClass?: string;
  /** Produce standalone document with preamble */
  standalone?: boolean;
}

/**
 * Convert Markdown to LaTeX using Pandoc
 */
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
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Pandoc conversion failed: ${message}`);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pandoc/converter.ts src/pandoc/converter.test.ts
git commit -m "feat: add pandoc markdown to latex conversion"
```

---

### Task 3.3: Pandoc Module Index

**Files:**
- Create: `src/pandoc/index.ts`

**Step 1: Create index.ts exporting all pandoc functions**

```typescript
// src/pandoc/index.ts
export { findPandoc, isPandocAvailable, getPandocVersion } from './detector';
export { convertToLatex, type ConvertOptions } from './converter';
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

**Step 3: Commit**

```bash
git add src/pandoc/index.ts
git commit -m "chore: add pandoc module exports"
```

---

## Phase 4: Post-processor

### Task 4.1: Reference Replacement

**Files:**
- Create: `src/postprocessor/references.ts`
- Create: `src/postprocessor/references.test.ts`

**Step 1: Write failing test for reference replacement**

```typescript
// src/postprocessor/references.test.ts
import { describe, it, expect } from 'vitest';
import { replaceReferencePlaceholders } from './references';

describe('replaceReferencePlaceholders', () => {
  it('replaces EQREF placeholder with eqref', () => {
    const input = 'See {{EQREF:eq-energy}} for the formula.';
    const result = replaceReferencePlaceholders(input);
    expect(result).toBe('See \\eqref{eq-energy} for the formula.');
  });

  it('replaces multiple placeholders', () => {
    const input = 'From {{EQREF:eq-1}} and {{EQREF:eq-2}}.';
    const result = replaceReferencePlaceholders(input);
    expect(result).toBe('From \\eqref{eq-1} and \\eqref{eq-2}.');
  });

  it('handles content without placeholders', () => {
    const input = 'No references here.';
    const result = replaceReferencePlaceholders(input);
    expect(result).toBe('No references here.');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create references.ts**

```typescript
// src/postprocessor/references.ts

/**
 * Replace reference placeholders with LaTeX commands
 */
export function replaceReferencePlaceholders(content: string): string {
  // Replace {{EQREF:label}} with \eqref{label}
  return content.replace(/\{\{EQREF:([^}]+)\}\}/g, '\\eqref{$1}');
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/postprocessor/references.ts src/postprocessor/references.test.ts
git commit -m "feat: add reference placeholder replacement"
```

---

### Task 4.2: Document Assembly

**Files:**
- Create: `src/postprocessor/assembler.ts`
- Create: `src/postprocessor/assembler.test.ts`

**Step 1: Write failing test for document assembly**

```typescript
// src/postprocessor/assembler.test.ts
import { describe, it, expect } from 'vitest';
import { assembleDocument, assembleMultiFile } from './assembler';

describe('assembleDocument', () => {
  it('creates standalone document with preamble', () => {
    const body = '\\section{Hello}\n\nWorld';
    const preamble = '\\usepackage{amsmath}';
    const result = assembleDocument(body, {
      preamble,
      documentClass: 'article',
      classOptions: ['12pt'],
    });

    expect(result).toContain('\\documentclass[12pt]{article}');
    expect(result).toContain('\\usepackage{amsmath}');
    expect(result).toContain('\\begin{document}');
    expect(result).toContain('\\section{Hello}');
    expect(result).toContain('\\end{document}');
  });

  it('uses default document class', () => {
    const result = assembleDocument('content', {});
    expect(result).toContain('\\documentclass{article}');
  });
});

describe('assembleMultiFile', () => {
  it('creates main file with inputs', () => {
    const files = ['intro', 'chapter1', 'chapter2'];
    const result = assembleMultiFile(files, {
      documentClass: 'book',
      preamble: '\\usepackage{amsthm}',
    });

    expect(result).toContain('\\documentclass{book}');
    expect(result).toContain('\\input{intro}');
    expect(result).toContain('\\input{chapter1}');
    expect(result).toContain('\\input{chapter2}');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create assembler.ts**

```typescript
// src/postprocessor/assembler.ts

export interface DocumentOptions {
  documentClass?: string;
  classOptions?: string[];
  preamble?: string;
}

/**
 * Assemble a standalone LaTeX document
 */
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

/**
 * Assemble main.tex for multi-file export
 */
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
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/postprocessor/assembler.ts src/postprocessor/assembler.test.ts
git commit -m "feat: add document assembly for single and multi-file export"
```

---

### Task 4.3: Post-processor Index

**Files:**
- Create: `src/postprocessor/index.ts`

**Step 1: Create index.ts**

```typescript
// src/postprocessor/index.ts
export { replaceReferencePlaceholders } from './references';
export { assembleDocument, assembleMultiFile, type DocumentOptions } from './assembler';
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

**Step 3: Commit**

```bash
git add src/postprocessor/index.ts
git commit -m "chore: add postprocessor module exports"
```

---

## Phase 5: Configuration Loading

### Task 5.1: Style File Parser

**Files:**
- Create: `src/config/style.ts`
- Create: `src/config/style.test.ts`

**Step 1: Write failing test for style file parsing**

```typescript
// src/config/style.test.ts
import { describe, it, expect } from 'vitest';
import { parseStyleFile, StyleConfig, DEFAULT_STYLE } from './style';

describe('parseStyleFile', () => {
  it('parses complete style file', () => {
    const yaml = `
preamble: ./preamble.tex
documentclass: book
classoptions:
  - 12pt
  - a4paper
order:
  - intro
  - chapter1
`;
    const result = parseStyleFile(yaml);
    expect(result.preamble).toBe('./preamble.tex');
    expect(result.documentclass).toBe('book');
    expect(result.classoptions).toEqual(['12pt', 'a4paper']);
    expect(result.order).toEqual(['intro', 'chapter1']);
  });

  it('uses defaults for missing fields', () => {
    const yaml = `documentclass: report`;
    const result = parseStyleFile(yaml);
    expect(result.documentclass).toBe('report');
    expect(result.preamble).toBe('');
    expect(result.classoptions).toEqual([]);
  });

  it('returns defaults for empty input', () => {
    const result = parseStyleFile('');
    expect(result).toEqual(DEFAULT_STYLE);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Add js-yaml dependency**

Add to `package.json` dependencies:
```json
"js-yaml": "^4.1.0"
```

Add to devDependencies:
```json
"@types/js-yaml": "^4.0.9"
```

Run: `npm install`

**Step 4: Create style.ts**

```typescript
// src/config/style.ts
import yaml from 'js-yaml';

export interface StyleConfig {
  preamble: string;
  documentclass: string;
  classoptions: string[];
  order: string[];
}

export const DEFAULT_STYLE: StyleConfig = {
  preamble: '',
  documentclass: 'article',
  classoptions: [],
  order: [],
};

/**
 * Parse a style YAML file
 */
export function parseStyleFile(content: string): StyleConfig {
  if (!content.trim()) {
    return { ...DEFAULT_STYLE };
  }

  try {
    const parsed = yaml.load(content) as Partial<StyleConfig>;
    return {
      preamble: parsed.preamble || DEFAULT_STYLE.preamble,
      documentclass: parsed.documentclass || DEFAULT_STYLE.documentclass,
      classoptions: parsed.classoptions || DEFAULT_STYLE.classoptions,
      order: parsed.order || DEFAULT_STYLE.order,
    };
  } catch {
    return { ...DEFAULT_STYLE };
  }
}
```

**Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/config/style.ts src/config/style.test.ts package.json package-lock.json
git commit -m "feat: add style file YAML parser"
```

---

### Task 5.2: Frontmatter Parser

**Files:**
- Create: `src/config/frontmatter.ts`
- Create: `src/config/frontmatter.test.ts`

**Step 1: Write failing test for frontmatter parsing**

```typescript
// src/config/frontmatter.test.ts
import { describe, it, expect } from 'vitest';
import { extractFrontmatter, parseFrontmatterConfig } from './frontmatter';

describe('extractFrontmatter', () => {
  it('extracts YAML frontmatter', () => {
    const content = `---
title: My Note
latex:
  documentclass: book
---

# Content here`;

    const result = extractFrontmatter(content);
    expect(result.frontmatter).toContain('title: My Note');
    expect(result.body).toContain('# Content here');
    expect(result.body).not.toContain('---');
  });

  it('handles content without frontmatter', () => {
    const content = '# Just content';
    const result = extractFrontmatter(content);
    expect(result.frontmatter).toBe('');
    expect(result.body).toBe('# Just content');
  });
});

describe('parseFrontmatterConfig', () => {
  it('extracts latex config from frontmatter', () => {
    const frontmatter = `
title: My Note
latex:
  preamble: ./custom.tex
  documentclass: report
`;
    const result = parseFrontmatterConfig(frontmatter);
    expect(result.preamble).toBe('./custom.tex');
    expect(result.documentclass).toBe('report');
  });

  it('returns empty config when no latex section', () => {
    const frontmatter = `title: Note`;
    const result = parseFrontmatterConfig(frontmatter);
    expect(result).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create frontmatter.ts**

```typescript
// src/config/frontmatter.ts
import yaml from 'js-yaml';
import type { StyleConfig } from './style';

export interface FrontmatterResult {
  frontmatter: string;
  body: string;
}

/**
 * Extract YAML frontmatter from markdown content
 */
export function extractFrontmatter(content: string): FrontmatterResult {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (match) {
    return {
      frontmatter: match[1],
      body: match[2],
    };
  }

  return {
    frontmatter: '',
    body: content,
  };
}

/**
 * Parse latex configuration from frontmatter YAML
 */
export function parseFrontmatterConfig(frontmatter: string): Partial<StyleConfig> {
  if (!frontmatter.trim()) {
    return {};
  }

  try {
    const parsed = yaml.load(frontmatter) as { latex?: Partial<StyleConfig> };
    return parsed.latex || {};
  } catch {
    return {};
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/config/frontmatter.ts src/config/frontmatter.test.ts
git commit -m "feat: add frontmatter extraction and latex config parsing"
```

---

### Task 5.3: Configuration Merger

**Files:**
- Create: `src/config/index.ts`
- Create: `src/config/index.test.ts`

**Step 1: Write failing test for config merging**

```typescript
// src/config/index.test.ts
import { describe, it, expect } from 'vitest';
import { mergeConfigs } from './index';
import { DEFAULT_STYLE } from './style';

describe('mergeConfigs', () => {
  it('frontmatter overrides style file', () => {
    const styleConfig = { ...DEFAULT_STYLE, documentclass: 'article' };
    const frontmatterConfig = { documentclass: 'book' };

    const result = mergeConfigs(styleConfig, frontmatterConfig);
    expect(result.documentclass).toBe('book');
  });

  it('preserves style config when frontmatter empty', () => {
    const styleConfig = { ...DEFAULT_STYLE, preamble: './my.tex' };
    const frontmatterConfig = {};

    const result = mergeConfigs(styleConfig, frontmatterConfig);
    expect(result.preamble).toBe('./my.tex');
  });

  it('merges classoptions arrays', () => {
    const styleConfig = { ...DEFAULT_STYLE, classoptions: ['12pt'] };
    const frontmatterConfig = { classoptions: ['a4paper'] };

    const result = mergeConfigs(styleConfig, frontmatterConfig);
    // Frontmatter replaces, not merges
    expect(result.classoptions).toEqual(['a4paper']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create index.ts with merge logic**

```typescript
// src/config/index.ts
export { parseStyleFile, DEFAULT_STYLE, type StyleConfig } from './style';
export { extractFrontmatter, parseFrontmatterConfig } from './frontmatter';

import type { StyleConfig } from './style';

/**
 * Merge style config with frontmatter overrides
 * Frontmatter takes precedence
 */
export function mergeConfigs(
  styleConfig: StyleConfig,
  frontmatterConfig: Partial<StyleConfig>
): StyleConfig {
  return {
    preamble: frontmatterConfig.preamble ?? styleConfig.preamble,
    documentclass: frontmatterConfig.documentclass ?? styleConfig.documentclass,
    classoptions: frontmatterConfig.classoptions ?? styleConfig.classoptions,
    order: frontmatterConfig.order ?? styleConfig.order,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/config/index.ts src/config/index.test.ts
git commit -m "feat: add configuration merging with precedence"
```

---

## Phase 6: Export Pipeline

### Task 6.1: Single File Export

**Files:**
- Create: `src/exporter/single.ts`
- Create: `src/exporter/single.test.ts`

**Step 1: Write failing test for single file export**

```typescript
// src/exporter/single.test.ts
import { describe, it, expect, vi } from 'vitest';
import { exportSingleFile, ExportResult } from './single';

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue(Buffer.from('\\section{Test}')),
}));

describe('exportSingleFile', () => {
  it('produces complete export result', async () => {
    const content = `---
latex:
  documentclass: article
---

# My Note

> [!theorem] Main
> Content

$$
E = mc^2
$$
^eq-energy

See [[#^eq-energy|Eq 1]].`;

    const mockFileResolver = vi.fn().mockResolvedValue(null);
    const mockPreambleLoader = vi.fn().mockResolvedValue('\\usepackage{amsmath}');

    const result = await exportSingleFile(content, {
      pandocPath: 'pandoc',
      styleConfig: {
        preamble: './preamble.tex',
        documentclass: 'article',
        classoptions: [],
        order: [],
      },
      fileResolver: mockFileResolver,
      preambleLoader: mockPreambleLoader,
    });

    expect(result.latex).toContain('\\documentclass');
    expect(result.latex).toContain('\\begin{document}');
    expect(result.latex).toContain('\\end{document}');
    expect(result.warnings).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create single.ts**

```typescript
// src/exporter/single.ts
import { preprocess } from '../preprocessor';
import { convertToLatex } from '../pandoc';
import { replaceReferencePlaceholders, assembleDocument } from '../postprocessor';
import { extractFrontmatter, parseFrontmatterConfig, mergeConfigs, type StyleConfig } from '../config';

export interface ExportOptions {
  pandocPath: string;
  styleConfig: StyleConfig;
  fileResolver: (path: string) => Promise<string | null>;
  preambleLoader: (path: string) => Promise<string>;
}

export interface ExportResult {
  latex: string;
  warnings: string[];
}

/**
 * Export a single markdown file to LaTeX
 */
export async function exportSingleFile(
  content: string,
  options: ExportOptions
): Promise<ExportResult> {
  const warnings: string[] = [];

  // 1. Extract frontmatter and merge config
  const { frontmatter, body } = extractFrontmatter(content);
  const frontmatterConfig = parseFrontmatterConfig(frontmatter);
  const config = mergeConfigs(options.styleConfig, frontmatterConfig);

  // 2. Preprocess (callouts, equations, wikilinks, embeds)
  const preprocessed = await preprocess(body, options.fileResolver);

  // Collect warnings from unresolved embeds
  const embedWarnings = preprocessed.match(/% WARNING: Could not resolve .+/g);
  if (embedWarnings) {
    warnings.push(...embedWarnings.map(w => w.replace('% WARNING: ', '')));
  }

  // 3. Convert to LaTeX via Pandoc
  const rawLatex = convertToLatex(preprocessed, options.pandocPath);

  // 4. Post-process (replace reference placeholders)
  const processedLatex = replaceReferencePlaceholders(rawLatex);

  // 5. Load preamble and assemble document
  let preamble = '';
  if (config.preamble) {
    try {
      preamble = await options.preambleLoader(config.preamble);
    } catch {
      warnings.push(`Could not load preamble: ${config.preamble}`);
    }
  }

  const finalLatex = assembleDocument(processedLatex, {
    documentClass: config.documentclass,
    classOptions: config.classoptions,
    preamble,
  });

  return { latex: finalLatex, warnings };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/exporter/single.ts src/exporter/single.test.ts
git commit -m "feat: add single file export pipeline"
```

---

### Task 6.2: Multi-File Export

**Files:**
- Create: `src/exporter/multi.ts`
- Create: `src/exporter/multi.test.ts`

**Step 1: Write failing test for multi-file export**

```typescript
// src/exporter/multi.test.ts
import { describe, it, expect, vi } from 'vitest';
import { exportFolder, MultiExportResult } from './multi';

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue(Buffer.from('content')),
}));

describe('exportFolder', () => {
  it('produces main.tex and individual files', async () => {
    const files = [
      { name: 'intro', content: '# Introduction\n\nHello' },
      { name: 'chapter1', content: '# Chapter 1\n\nWorld' },
    ];

    const mockFileResolver = vi.fn().mockResolvedValue(null);
    const mockPreambleLoader = vi.fn().mockResolvedValue('\\usepackage{amsmath}');

    const result = await exportFolder(files, {
      pandocPath: 'pandoc',
      styleConfig: {
        preamble: './preamble.tex',
        documentclass: 'book',
        classoptions: ['12pt'],
        order: [],
      },
      fileResolver: mockFileResolver,
      preambleLoader: mockPreambleLoader,
    });

    expect(result.mainTex).toContain('\\documentclass[12pt]{book}');
    expect(result.mainTex).toContain('\\input{intro}');
    expect(result.mainTex).toContain('\\input{chapter1}');
    expect(result.files).toHaveLength(2);
    expect(result.files[0].name).toBe('intro');
    expect(result.preamble).toBe('\\usepackage{amsmath}');
  });

  it('respects order from style config', async () => {
    const files = [
      { name: 'chapter1', content: '# Ch1' },
      { name: 'intro', content: '# Intro' },
    ];

    const result = await exportFolder(files, {
      pandocPath: 'pandoc',
      styleConfig: {
        preamble: '',
        documentclass: 'article',
        classoptions: [],
        order: ['intro', 'chapter1'],
      },
      fileResolver: vi.fn().mockResolvedValue(null),
      preambleLoader: vi.fn().mockResolvedValue(''),
    });

    const introIndex = result.mainTex.indexOf('\\input{intro}');
    const ch1Index = result.mainTex.indexOf('\\input{chapter1}');
    expect(introIndex).toBeLessThan(ch1Index);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - module not found

**Step 3: Create multi.ts**

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/exporter/multi.ts src/exporter/multi.test.ts
git commit -m "feat: add multi-file folder export"
```

---

### Task 6.3: Exporter Index

**Files:**
- Create: `src/exporter/index.ts`

**Step 1: Create index.ts**

```typescript
// src/exporter/index.ts
export { exportSingleFile, type ExportOptions, type ExportResult } from './single';
export { exportFolder, type FileInput, type FileOutput, type MultiExportOptions, type MultiExportResult } from './multi';
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

**Step 3: Commit**

```bash
git add src/exporter/index.ts
git commit -m "chore: add exporter module exports"
```

---

## Phase 7: Plugin Integration

### Task 7.1: Wire Up Commands

**Files:**
- Modify: `src/main.ts`
- Create: `src/commands.ts`

**Step 1: Create commands.ts**

```typescript
// src/commands.ts
import { App, Notice, TFile, TFolder } from 'obsidian';
import { findPandoc } from './pandoc';
import { parseStyleFile, DEFAULT_STYLE } from './config';
import { exportSingleFile } from './exporter/single';
import { exportFolder } from './exporter/multi';
import type { Obs2LatexSettings } from './settings';

export async function exportCurrentNote(app: App, settings: Obs2LatexSettings): Promise<void> {
  const activeFile = app.workspace.getActiveFile();
  if (!activeFile) {
    new Notice('No active file to export');
    return;
  }

  if (activeFile.extension !== 'md') {
    new Notice('Active file is not a Markdown file');
    return;
  }

  // Check Pandoc
  const pandocPath = findPandoc(settings.pandocPath);
  if (!pandocPath) {
    new Notice('Pandoc not found. Please install Pandoc or set the path in settings.');
    return;
  }

  try {
    const content = await app.vault.read(activeFile);

    // Load style config
    let styleConfig = { ...DEFAULT_STYLE };
    if (settings.defaultStyleFile) {
      const styleFile = app.vault.getAbstractFileByPath(settings.defaultStyleFile);
      if (styleFile instanceof TFile) {
        const styleContent = await app.vault.read(styleFile);
        styleConfig = parseStyleFile(styleContent);
      }
    }

    // File resolver for embeds
    const fileResolver = async (path: string): Promise<string | null> => {
      const file = app.metadataCache.getFirstLinkpathDest(path, activeFile.path);
      if (file instanceof TFile) {
        return app.vault.read(file);
      }
      return null;
    };

    // Preamble loader
    const preambleLoader = async (path: string): Promise<string> => {
      const file = app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        return app.vault.read(file);
      }
      throw new Error(`Preamble not found: ${path}`);
    };

    const result = await exportSingleFile(content, {
      pandocPath,
      styleConfig,
      fileResolver,
      preambleLoader,
    });

    // Write output
    const exportFolder = settings.exportFolder || 'latex-exports';
    const outputPath = `${exportFolder}/${activeFile.basename}.tex`;

    // Ensure export folder exists
    if (!await app.vault.adapter.exists(exportFolder)) {
      await app.vault.createFolder(exportFolder);
    }

    await app.vault.adapter.write(outputPath, result.latex);

    // Show result
    if (result.warnings.length > 0) {
      new Notice(`Exported with ${result.warnings.length} warning(s). Check console.`);
      console.warn('Export warnings:', result.warnings);
    } else {
      new Notice(`Exported to ${outputPath}`);
    }

    // Open if requested
    if (settings.openAfterExport) {
      // Use Obsidian's openUrl to open with system default app
      const fullPath = app.vault.adapter.getFullPath(outputPath);
      window.open(`file://${fullPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    new Notice(`Export failed: ${message}`);
    console.error('Export error:', error);
  }
}

export async function exportFolderToLatex(
  app: App,
  settings: Obs2LatexSettings,
  folder: TFolder
): Promise<void> {
  const pandocPath = findPandoc(settings.pandocPath);
  if (!pandocPath) {
    new Notice('Pandoc not found. Please install Pandoc or set the path in settings.');
    return;
  }

  try {
    // Collect markdown files
    const mdFiles = folder.children.filter(
      (f): f is TFile => f instanceof TFile && f.extension === 'md'
    );

    if (mdFiles.length === 0) {
      new Notice('No Markdown files in folder');
      return;
    }

    new Notice(`Exporting ${mdFiles.length} files...`);

    // Load style config (check for _style.yaml in folder first)
    let styleConfig = { ...DEFAULT_STYLE };
    const folderStylePath = `${folder.path}/_style.yaml`;
    const folderStyleFile = app.vault.getAbstractFileByPath(folderStylePath);

    if (folderStyleFile instanceof TFile) {
      const styleContent = await app.vault.read(folderStyleFile);
      styleConfig = parseStyleFile(styleContent);
    } else if (settings.defaultStyleFile) {
      const defaultStyleFile = app.vault.getAbstractFileByPath(settings.defaultStyleFile);
      if (defaultStyleFile instanceof TFile) {
        const styleContent = await app.vault.read(defaultStyleFile);
        styleConfig = parseStyleFile(styleContent);
      }
    }

    // Prepare files
    const files = await Promise.all(
      mdFiles.map(async (f) => ({
        name: f.basename,
        content: await app.vault.read(f),
      }))
    );

    // File resolver
    const fileResolver = async (path: string): Promise<string | null> => {
      const file = app.metadataCache.getFirstLinkpathDest(path, folder.path);
      if (file instanceof TFile) {
        return app.vault.read(file);
      }
      return null;
    };

    // Preamble loader
    const preambleLoader = async (path: string): Promise<string> => {
      // Resolve relative to folder or absolute
      const resolvedPath = path.startsWith('./')
        ? `${folder.path}/${path.slice(2)}`
        : path;
      const file = app.vault.getAbstractFileByPath(resolvedPath);
      if (file instanceof TFile) {
        return app.vault.read(file);
      }
      throw new Error(`Preamble not found: ${path}`);
    };

    const result = await exportFolder(files, {
      pandocPath,
      styleConfig,
      fileResolver,
      preambleLoader,
    });

    // Write output
    const exportBase = settings.exportFolder || 'latex-exports';
    const outputFolder = `${exportBase}/${folder.name}`;

    if (!await app.vault.adapter.exists(outputFolder)) {
      await app.vault.createFolder(outputFolder);
    }

    // Write main.tex
    await app.vault.adapter.write(`${outputFolder}/main.tex`, result.mainTex);

    // Write preamble if exists
    if (result.preamble) {
      await app.vault.adapter.write(`${outputFolder}/preamble.tex`, result.preamble);
    }

    // Write individual files
    for (const file of result.files) {
      await app.vault.adapter.write(`${outputFolder}/${file.name}.tex`, file.latex);
    }

    // Show result
    if (result.warnings.length > 0) {
      new Notice(`Exported ${result.files.length} files with ${result.warnings.length} warning(s)`);
      console.warn('Export warnings:', result.warnings);
    } else {
      new Notice(`Exported ${result.files.length} files to ${outputFolder}`);
    }

    if (settings.openAfterExport) {
      const fullPath = app.vault.adapter.getFullPath(`${outputFolder}/main.tex`);
      window.open(`file://${fullPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    new Notice(`Export failed: ${message}`);
    console.error('Export error:', error);
  }
}
```

**Step 2: Update main.ts to register commands and context menus**

```typescript
// src/main.ts
import { Plugin, TFile, TFolder } from 'obsidian';
import { DEFAULT_SETTINGS, Obs2LatexSettings, Obs2LatexSettingTab } from "./settings";
import { exportCurrentNote, exportFolderToLatex } from './commands';

export default class Obs2LatexPlugin extends Plugin {
  settings: Obs2LatexSettings;

  async onload() {
    await this.loadSettings();

    // Settings tab
    this.addSettingTab(new Obs2LatexSettingTab(this.app, this));

    // Command: Export current note
    this.addCommand({
      id: 'export-current-note',
      name: 'Export current note to LaTeX',
      callback: () => exportCurrentNote(this.app, this.settings),
    });

    // File menu: Export to LaTeX
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) => {
            item
              .setTitle('Export to LaTeX')
              .setIcon('file-output')
              .onClick(() => {
                // Set as active file and export
                this.app.workspace.getLeaf().openFile(file).then(() => {
                  exportCurrentNote(this.app, this.settings);
                });
              });
          });
        } else if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Export folder to LaTeX')
              .setIcon('folder-output')
              .onClick(() => exportFolderToLatex(this.app, this.settings, file));
          });
        }
      })
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Compiles without errors

**Step 4: Commit**

```bash
git add src/main.ts src/commands.ts
git commit -m "feat: integrate export commands and context menus"
```

---

### Task 7.2: Update Manifest and README

**Files:**
- Modify: `manifest.json`
- Modify: `README.md`

**Step 1: Update manifest.json**

```json
{
  "id": "obs2latex",
  "name": "obs2latex",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "Convert Obsidian Markdown to LaTeX with proper cross-references, equations, and environments",
  "author": "Your Name",
  "authorUrl": "",
  "isDesktopOnly": true
}
```

**Step 2: Update README.md**

```markdown
# obs2latex

Convert Obsidian Markdown to LaTeX with proper cross-references, equation handling, and environment support.

## Features

- **Equation labels**: Use `^eq-name` after `$$` blocks to create labeled equations
- **Cross-references**: `[[Note#^eq-name|Eq 1]]` → `\eqref{eq-name}`
- **Equation embeds**: `![[Note#^eq-name]]` fetches and inserts equations from other files
- **Callout environments**: `> [!theorem]` → `\begin{theorem}...\end{theorem}`
- **Multi-file export**: Export folders with `\input{}` structure

## Requirements

- [Pandoc](https://pandoc.org/installing.html) must be installed

## Usage

### Single file
1. Open a Markdown file
2. Run command: `Export current note to LaTeX`
3. Or right-click the file → `Export to LaTeX`

### Folder
1. Right-click a folder → `Export folder to LaTeX`
2. Creates `main.tex` with `\input{}` for each file

## Configuration

### Plugin settings
- **Export folder**: Where LaTeX files are saved (default: `latex-exports/`)
- **Default style file**: Path to default `style.yaml`
- **Pandoc path**: Custom Pandoc location (auto-detected by default)
- **Open after export**: Open `.tex` file in default app

### Style file (`style.yaml`)
```yaml
preamble: ./preamble.tex
documentclass: article
classoptions: [12pt, a4paper]
order:
  - intro
  - chapter1
```

### Frontmatter override
```yaml
---
latex:
  documentclass: book
  preamble: ./custom-preamble.tex
---
```

## Callout → Environment mapping

| Callout | LaTeX |
|---------|-------|
| `[!theorem]` | `theorem` |
| `[!lemma]` | `lemma` |
| `[!proof]` | `proof` |
| `[!definition]` | `definition` |
| `[!corollary]` | `corollary` |
| `[!proposition]` | `proposition` |
| `[!remark]` | `remark` |
| `[!example]` | `example` |
| `[!exercise]` | `exercise` |
| Unknown | `notebox` |
```

**Step 3: Commit**

```bash
git add manifest.json README.md
git commit -m "docs: update manifest and README for obs2latex"
```

---

## Final: Build and Manual Test

### Task 8.1: Final Build

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (warnings acceptable)

**Step 3: Production build**

Run: `npm run build`
Expected: Compiles successfully, produces `main.js`

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: finalize build and prepare for testing"
```

---

## Manual Testing Checklist

After completing implementation:

1. Copy `main.js`, `manifest.json`, `styles.css` to test vault
2. Enable plugin in Obsidian
3. Verify settings tab appears and saves correctly
4. Test single file export with equations and callouts
5. Test cross-file references
6. Test folder export
7. Verify Pandoc missing error appears correctly
