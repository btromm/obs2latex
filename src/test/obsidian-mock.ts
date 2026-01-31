// Mock for Obsidian API
// This file provides stubs for Obsidian classes used in testing

export class App {}

export class Plugin {
  app: App;
  manifest: Record<string, unknown>;

  loadData(): Promise<unknown> {
    return Promise.resolve({});
  }

  saveData(_data: unknown): Promise<void> {
    return Promise.resolve();
  }

  addSettingTab(_tab: PluginSettingTab): void {}
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display(): void {}
  hide(): void {}
}

export class Setting {
  constructor(_containerEl: HTMLElement) {}

  setName(_name: string): this {
    return this;
  }

  setDesc(_desc: string): this {
    return this;
  }

  addText(_cb: (text: TextComponent) => void): this {
    return this;
  }

  addToggle(_cb: (toggle: ToggleComponent) => void): this {
    return this;
  }
}

export class TextComponent {
  setPlaceholder(_placeholder: string): this {
    return this;
  }

  setValue(_value: string): this {
    return this;
  }

  onChange(_cb: (value: string) => void): this {
    return this;
  }
}

export class ToggleComponent {
  setValue(_value: boolean): this {
    return this;
  }

  onChange(_cb: (value: boolean) => void): this {
    return this;
  }
}

export class Notice {
  constructor(_message: string, _timeout?: number) {}
}

export class Modal {
  app: App;
  contentEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
  }

  open(): void {}
  close(): void {}
  onOpen(): void {}
  onClose(): void {}
}

export class Editor {}
export class MarkdownView {}
export class TFile {}
export class TFolder {}
export class TAbstractFile {}
