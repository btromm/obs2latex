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
