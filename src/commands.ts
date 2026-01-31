// src/commands.ts
import { App, Notice, TFile, TFolder, FileSystemAdapter } from 'obsidian';
import { findPandoc } from './pandoc';
import { DEFAULT_STYLE } from './config';
import { exportSingleFile } from './exporter/single';
import { exportFolder } from './exporter/multi';
import type { Obs2LatexSettings } from './settings';

function getFullPath(app: App, path: string): string {
  const adapter = app.vault.adapter;
  if (adapter instanceof FileSystemAdapter) {
    return adapter.getFullPath(path);
  }
  return path;
}

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

    // Use default style with preamble path from settings
    const styleConfig = {
      ...DEFAULT_STYLE,
      preamble: settings.defaultPreamble,
    };

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
    const exportFolderPath = settings.exportFolder || 'latex-exports';
    const outputPath = `${exportFolderPath}/${activeFile.basename}.tex`;

    // Ensure export folder exists
    if (!await app.vault.adapter.exists(exportFolderPath)) {
      await app.vault.createFolder(exportFolderPath);
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
      const fullPath = getFullPath(app, outputPath);
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
    // Collect markdown files (sorted alphabetically for ordering)
    const mdFiles = folder.children
      .filter((f): f is TFile => f instanceof TFile && f.extension === 'md')
      .sort((a, b) => a.basename.localeCompare(b.basename));

    if (mdFiles.length === 0) {
      new Notice('No Markdown files in folder');
      return;
    }

    new Notice(`Exporting ${mdFiles.length} files...`);

    // Check for preamble.tex in folder, otherwise use default
    let preamblePath = settings.defaultPreamble;
    const folderPreamblePath = `${folder.path}/preamble.tex`;
    const folderPreambleFile = app.vault.getAbstractFileByPath(folderPreamblePath);
    if (folderPreambleFile instanceof TFile) {
      preamblePath = folderPreamblePath;
    }

    const styleConfig = {
      ...DEFAULT_STYLE,
      preamble: preamblePath,
    };

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
      const fullPath = getFullPath(app, `${outputFolder}/main.tex`);
      window.open(`file://${fullPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    new Notice(`Export failed: ${message}`);
    console.error('Export error:', error);
  }
}
