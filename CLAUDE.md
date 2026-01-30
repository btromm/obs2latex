# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

obs2latex is an Obsidian plugin that converts Obsidian Markdown to LaTeX. It uses a hybrid architecture: TypeScript preprocesses Obsidian-specific syntax (wikilinks, callouts, embeds), then Pandoc handles Markdown→LaTeX conversion with custom Lua filters.

**Design document:** `docs/plans/2026-01-30-obs2latex-design.md`

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Development build with watch mode
npm run build        # Production build (type-check + bundle)
npm run lint         # Run ESLint
```

## Testing the Plugin

Copy build artifacts to an Obsidian vault:
```bash
cp main.js manifest.json styles.css <Vault>/.obsidian/plugins/obs2latex/
```
Then reload Obsidian and enable the plugin in Settings → Community plugins.

## Architecture

### Three-Stage Pipeline

```
Obsidian Markdown → Preprocessor → Standard Markdown → Pandoc → LaTeX
```

1. **Preprocessor (TypeScript):** Resolves wikilinks/embeds, converts callouts to fenced divs, extracts equation labels
2. **Pandoc:** Converts to LaTeX via child process with custom Lua filter
3. **Post-processor (TypeScript):** Replaces placeholders with `\eqref{}`, assembles multi-file structure

### Key Conversions

- `[[Note#^eq-1|Eq 1]]` → `\eqref{eq-1}` (reference)
- `![[Note#^eq-1]]` → Fetches and inserts the equation (embed)
- `> [!theorem] Title` → `\begin{theorem}[Title]...\end{theorem}`
- `$$ ... $$ ^eq-label` → `\begin{equation}\label{eq-label}...\end{equation}`
- Inner `\begin{align}` or `\begin{aligned}` → promoted to top-level `\begin{align}`

### Configuration Precedence

1. Frontmatter `latex:` block in the file
2. Folder-level `_style.yaml`
3. Plugin settings default style file

## File Structure

```
src/
  main.ts           # Plugin entry point, lifecycle only
  settings.ts       # Settings interface and tab
  # Future modules:
  # preprocessor/   # Wikilink/embed/callout processing
  # pandoc/         # Pandoc invocation and Lua filters
  # postprocessor/  # Reference replacement, file assembly
```

## External Dependency

Pandoc must be installed on the user's system. The plugin should detect its presence on load and show an actionable error if missing.
