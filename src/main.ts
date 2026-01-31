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
