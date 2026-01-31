// src/config/style.ts

export interface StyleConfig {
  preamble: string;
  documentclass: string;
  classoptions: string[];
}

export const DEFAULT_STYLE: StyleConfig = {
  preamble: '',
  documentclass: 'article',
  classoptions: [],
};
