# obs2latex Design

Obsidian plugin that converts Obsidian Markdown to LaTeX with proper cross-references, equation handling, and environment support.

## Architecture

Three-stage pipeline:

```
Obsidian Markdown → Preprocessor → Standard Markdown → Pandoc → LaTeX
```

### Stage 1: Preprocessor (TypeScript)

- Resolves wikilinks: `[[Note#^eq-1|Eq 1]]` → placeholder markers
- Expands embeds: `![[Note#^eq-1]]` → fetches actual content from vault
- Converts callouts: `> [!theorem]` → fenced div syntax Pandoc understands
- Collects equation labels: `^eq-1` after `$$` blocks → generates `\label{}`

### Stage 2: Pandoc (via child process)

- Converts preprocessed Markdown to LaTeX
- Custom Lua filter handles placeholder markers and fenced divs
- Produces clean LaTeX with proper math environments

### Stage 3: Post-processor (TypeScript)

- Replaces reference placeholders with `\eqref{}` calls
- Assembles multi-file structure with `\input{}` statements
- Writes files to export folder

**External dependency:** Pandoc must be installed. Plugin checks on load and shows helpful error if missing.

## Configuration

### Precedence (highest first)

1. **Frontmatter in the file**
   ```yaml
   ---
   latex:
     preamble: ./my-preamble.tex
     documentclass: book
   ---
   ```

2. **Folder-level `_style.yaml`** — project-specific defaults

3. **Plugin settings default style file** — global fallback

### Style file format

```yaml
preamble: ./preamble.tex      # Path to LaTeX preamble (relative to style file)
documentclass: article         # Or book, report, memoir, etc.
classoptions: [12pt, a4paper]  # Optional document class options
order:                         # Optional: control file order in multi-file export
  - intro
  - chapter1
  - chapter2
```

### Plugin settings

- Export folder path (default: `latex-exports/`)
- Default style file path (optional)
- Pandoc path (auto-detected, manual override)
- Toggle: Open `.tex` file in default app after export

## Callouts → Environments

Fixed mapping to standard LaTeX environments:

| Callout | LaTeX Environment |
|---------|-------------------|
| `[!theorem]` | `\begin{theorem}` |
| `[!lemma]` | `\begin{lemma}` |
| `[!proposition]` | `\begin{proposition}` |
| `[!corollary]` | `\begin{corollary}` |
| `[!definition]` | `\begin{definition}` |
| `[!proof]` | `\begin{proof}` |
| `[!remark]` | `\begin{remark}` |
| `[!example]` | `\begin{example}` |
| `[!exercise]` | `\begin{exercise}` |
| Unknown | `\begin{notebox}` (generic fallback) |

### Callout title handling

```markdown
> [!theorem] Pythagorean Theorem
> Content here
```

Becomes:

```latex
\begin{theorem}[Pythagorean Theorem]
Content here
\end{theorem}
```

## Equations

### Labeling

```markdown
$$
E = mc^2
$$
^eq-energy
```

Becomes:

```latex
\begin{equation}\label{eq-energy}
E = mc^2
\end{equation}
```

### Environment detection

| Source | Output |
|--------|--------|
| `$$ x = 1 $$` | `\begin{equation} x = 1 \end{equation}` |
| `$$ \begin{align} ... \end{align} $$` | `\begin{align} ... \end{align}` (no wrapper) |
| `$$ \begin{aligned} ... \end{aligned} $$` | `\begin{align} ... \end{align}` (convert aligned→align) |

Labels placed appropriately:

```latex
\begin{align}\label{eq-energy}
E &= mc^2 \\
p &= mv
\end{align}
```

### References vs Embeds

- `[[Note#^eq-energy|Equation 1]]` → `\eqref{eq-energy}` (clickable reference)
- `![[Note#^eq-energy]]` → Fetches equation from source file, inserts full equation block

## Multi-File Export

Exporting a folder preserves structure:

```
vault/
  thesis/
    intro.md
    chapter1.md
    chapter2.md
    _style.yaml

→ exports to:

latex-exports/
  thesis/
    main.tex          # Generated master file
    intro.tex
    chapter1.tex
    chapter2.tex
    preamble.tex      # Copied from style reference
```

### Generated main.tex

```latex
\documentclass[12pt]{book}
\input{preamble}

\begin{document}

\input{intro}
\input{chapter1}
\input{chapter2}

\end{document}
```

### Ordering

Files included alphabetically by default. Control order with:
- Numeric prefixes: `01-intro.md`, `02-chapter1.md`
- Explicit `order` array in `_style.yaml`

### Cross-file references

Labels are global. `[[chapter1#^eq-5|Eq 5]]` in `chapter2.md` produces `\eqref{eq-5}` which LaTeX resolves correctly.

## Plugin Interface

### Command Palette

- `Export current note to LaTeX`

### Context Menu (Right-click)

- On file: `Export to LaTeX`
- On folder: `Export folder to LaTeX`

### Error Handling

- Missing Pandoc: Clear message with install instructions
- Unresolved embed `![[Missing#^eq-1]]`: Warning in console, placeholder comment in LaTeX (`% WARNING: Could not resolve Missing#^eq-1`)
- Invalid style file: Error notice with details

### Status Feedback

- Notice on successful export: "Exported to latex-exports/note.tex"
- Progress for multi-file: "Exporting 5 files..."
