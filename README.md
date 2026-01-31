# obs2latex

Convert Obsidian Markdown to LaTeX with proper cross-references, equations, and environments.

## Features

- **Equation labels**: `$$ E = mc^2 $$ ^eq-energy` → `\begin{equation}\label{eq-energy}...\end{equation}`
- **Cross-references**: `[[#^eq-energy|Eq 1]]` → `\eqref{eq-energy}`
- **Equation embeds**: `![[Note#^eq-energy]]` fetches and inserts equations from other files
- **Callout environments**: `> [!theorem]` → `\begin{theorem}...\end{theorem}`
- **Multi-file export**: Export folders with `main.tex` and `\input{}` structure

## Requirements

- [Pandoc](https://pandoc.org/installing.html) must be installed

## Installation

### Manual Installation

1. Download `main.js`, `manifest.json` from Releases
2. Create folder: `<vault>/.obsidian/plugins/obs2latex/`
3. Copy files into the folder
4. Enable in Settings → Community plugins

## Usage

### Single File Export

1. Open a Markdown note
2. Command Palette → "Export current note to LaTeX"
3. Or right-click file → "Export to LaTeX"

### Folder Export

1. Right-click a folder → "Export folder to LaTeX"
2. Creates:
   - `main.tex` with `\input{}` for each file
   - `preamble.tex` (if configured)
   - Individual `.tex` files (sorted alphabetically by filename)

**Tip**: Use filename prefixes for ordering: `01-intro.md`, `02-methods.md`, etc.

## Configuration

### Plugin Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Export folder | Output directory | `latex-exports` |
| Default preamble | Path to `preamble.tex` | (none) |
| Pandoc path | Custom Pandoc path | (auto-detect) |
| Open after export | Open `.tex` after export | Off |

### Preamble File

Create a `preamble.tex` with your LaTeX packages and theorem definitions:

```latex
\usepackage{amsmath}
\usepackage{amsthm}
\usepackage{hyperref}

\newtheorem{theorem}{Theorem}[section]
\newtheorem{lemma}[theorem]{Lemma}
\theoremstyle{definition}
\newtheorem{definition}[theorem]{Definition}
```

For folder exports, place `preamble.tex` inside the folder. Otherwise, set a default preamble path in settings.

### Frontmatter Overrides

Override settings per-file using YAML frontmatter:

```yaml
---
documentclass: book
classoptions:
  - 12pt
  - twoside
preamble: path/to/custom-preamble.tex
---
```

| Property | Description | Example |
|----------|-------------|---------|
| `documentclass` | LaTeX document class | `article`, `book`, `report` |
| `classoptions` | Options passed to documentclass | `[12pt, a4paper]` |
| `preamble` | Path to preamble file | `./my-preamble.tex` |

Frontmatter overrides the default preamble from plugin settings.

## Callout → Environment Mapping

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

## Example

**Markdown:**
```markdown
> [!theorem] Pythagorean Theorem
> For a right triangle: $a^2 + b^2 = c^2$

$$
E = mc^2
$$
^eq-energy

See [[#^eq-energy|Equation 1]].
```

**LaTeX output:**
```latex
\begin{theorem}[Pythagorean Theorem]
For a right triangle: $a^2 + b^2 = c^2$
\end{theorem}

\begin{equation}\label{eq-energy}
E = mc^2
\end{equation}

See \eqref{eq-energy}.
```

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
