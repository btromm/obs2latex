// src/preprocessor/wikilinks.test.ts
import { describe, it, expect } from 'vitest';
import { parseWikilink, processWikilinks, WikilinkType } from './wikilinks';

describe('parseWikilink', () => {
  it('parses simple wikilink', () => {
    const result = parseWikilink('[[Note]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: 'Note',
      anchor: null,
      display: null,
    });
  });

  it('parses wikilink with anchor', () => {
    const result = parseWikilink('[[Note#^eq-1]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: 'Note',
      anchor: 'eq-1',
      display: null,
    });
  });

  it('parses wikilink with display text', () => {
    const result = parseWikilink('[[Note#^eq-1|Equation 1]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: 'Note',
      anchor: 'eq-1',
      display: 'Equation 1',
    });
  });

  it('parses embed wikilink', () => {
    const result = parseWikilink('![[Note#^eq-1]]');
    expect(result).toEqual({
      type: WikilinkType.Embed,
      target: 'Note',
      anchor: 'eq-1',
      display: null,
    });
  });

  it('parses same-file anchor reference', () => {
    const result = parseWikilink('[[#^eq-local|Eq 5]]');
    expect(result).toEqual({
      type: WikilinkType.Reference,
      target: '',
      anchor: 'eq-local',
      display: 'Eq 5',
    });
  });
});

describe('processWikilinks', () => {
  it('converts equation reference to placeholder', () => {
    const input = 'See [[Note#^eq-energy|Equation 1]] for details.';
    const result = processWikilinks(input);
    expect(result).toContain('{{EQREF:eq-energy}}');
    expect(result).not.toContain('[[');
  });

  it('marks embeds for later resolution', () => {
    const input = 'The equation is: ![[Note#^eq-energy]]';
    const result = processWikilinks(input);
    expect(result).toContain('{{EMBED:Note#^eq-energy}}');
  });

  it('handles multiple wikilinks', () => {
    const input = 'From [[A#^eq-1|Eq 1]] and [[B#^eq-2|Eq 2]].';
    const result = processWikilinks(input);
    expect(result).toContain('{{EQREF:eq-1}}');
    expect(result).toContain('{{EQREF:eq-2}}');
  });
});
