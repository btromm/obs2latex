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
                void this.app.workspace.getLeaf().openFile(file).then(() => {
                  void exportCurrentNote(this.app, this.settings);
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as Obs2LatexSettings;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
