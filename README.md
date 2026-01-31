# obs2latex

Convert Obsidian Markdown to LaTeX with proper cross-references, equations, and environments.

## Features

- **Single file export**: Export individual Markdown notes to LaTeX
- **Folder export**: Export entire folders as multi-file LaTeX projects with `\input{}` structure
- **Equation support**: Preserve labeled equations with `\label{}` and convert `[[#^eq-label]]` to `\ref{}`
- **Callout to environment conversion**: Transform Obsidian callouts into LaTeX theorem environments
- **Wikilink references**: Convert `[[Note#Section]]` to proper `\ref{}` commands
- **Embed resolution**: Inline embedded notes during export
- **Custom preambles**: Use your own LaTeX preamble files
- **Style configuration**: Configure document class, options, and file ordering via YAML

## Requirements

- **Obsidian**: Version 1.0.0 or later
- **Pandoc**: Must be installed and accessible (auto-detected or manually configured)
  - Install via: `brew install pandoc` (macOS), `apt install pandoc` (Ubuntu), or [download](https://pandoc.org/installing.html)

## Installation

### From Obsidian Community Plugins

1. Open Settings > Community plugins
2. Search for "obs2latex"
3. Click Install, then Enable

### Manual Installation

1. Download the latest release (`main.js`, `manifest.json`) from Releases
2. Create folder: `<vault>/.obsidian/plugins/obs2latex/`
3. Copy files into the folder
4. Enable the plugin in Settings > Community plugins

## Usage

### Export Single Note

1. Open a Markdown note
2. Use Command Palette (`Cmd/Ctrl+P`) and search "Export current note to LaTeX"
3. Or right-click the file in the file explorer and select "Export to LaTeX"

### Export Folder

1. Right-click a folder in the file explorer
2. Select "Export folder to LaTeX"
3. Creates a multi-file project with:
   - `main.tex` - Document root with `\input{}` statements
   - `preamble.tex` - Your preamble (if configured)
   - Individual `.tex` files for each Markdown file

## Configuration

### Plugin Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Export folder | Output directory for LaTeX files | `latex-exports` |
| Default style file | Path to default `_style.yaml` | (none) |
| Pandoc path | Custom Pandoc executable path | (auto-detect) |
| Open after export | Open `.tex` file after export | Off |

### Style Configuration (`_style.yaml`)

Create a `_style.yaml` file in your folder to configure exports:

```yaml
# Document class
documentclass: article

# Class options
classoptions:
  - 12pt
  - a4paper

# Path to preamble file
preamble: ./preamble.tex

# File order for multi-file export
order:
  - introduction
  - methods
  - results
  - conclusion
```

For folder exports, place `_style.yaml` inside the folder. Otherwise, configure a default style file in settings.

### Preamble Files

Create a `preamble.tex` with your custom LaTeX packages and commands:

```latex
\usepackage{amsmath}
\usepackage{amsthm}
\usepackage{hyperref}

\newtheorem{theorem}{Theorem}
\newtheorem{lemma}{Lemma}
\newtheorem{definition}{Definition}
```

## Callout to Environment Mapping

Obsidian callouts are converted to LaTeX theorem-style environments:

| Callout Type | LaTeX Environment |
|--------------|-------------------|
| `[!theorem]` | `\begin{theorem}` |
| `[!lemma]` | `\begin{lemma}` |
| `[!definition]` | `\begin{definition}` |
| `[!proposition]` | `\begin{proposition}` |
| `[!corollary]` | `\begin{corollary}` |
| `[!example]` | `\begin{example}` |
| `[!remark]` | `\begin{remark}` |
| `[!proof]` | `\begin{proof}` |
| `[!note]` | `\begin{note}` |
| `[!warning]` | `\begin{warning}` |

### Example

Markdown:
```markdown
> [!theorem] Pythagorean Theorem
> For a right triangle with legs $a$, $b$ and hypotenuse $c$:
> $$a^2 + b^2 = c^2$$
```

LaTeX output:
```latex
\begin{theorem}[Pythagorean Theorem]
For a right triangle with legs $a$, $b$ and hypotenuse $c$:
\[a^2 + b^2 = c^2\]
\end{theorem}
```

## Cross-References

### Equation References

Label equations with `^eq-label` syntax:

```markdown
$$
E = mc^2
$$ ^eq-einstein

As shown in [[#^eq-einstein]], energy and mass are equivalent.
```

Output:
```latex
\begin{equation}\label{eq:einstein}
E = mc^2
\end{equation}

As shown in \ref{eq:einstein}, energy and mass are equivalent.
```

### Section References

Reference sections in other notes:

```markdown
See [[Introduction#Background]] for more details.
```

Output:
```latex
See \ref{sec:introduction-background} for more details.
```

## Frontmatter Overrides

Override style settings per-file using YAML frontmatter:

```markdown
---
latex:
  documentclass: book
  classoptions:
    - twoside
  preamble: ./custom-preamble.tex
---

# My Document
```

## Tips

- **Unsupported callouts**: Unknown callout types are passed through as-is with a comment
- **Missing embeds**: Unresolved embeds generate a LaTeX comment warning
- **Pandoc required**: This plugin requires Pandoc for Markdown-to-LaTeX conversion
- **Desktop only**: This plugin uses Node.js APIs and is desktop-only

## Development

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Run tests
npm test

# Development mode (watch)
npm run dev
```

## License

MIT
