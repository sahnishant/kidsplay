import { describe, expect, it } from 'vitest';
import { childPromptParts, childPromptSpeechText } from '../src/presentation/childPrompt';

describe('generic child prompt blanks', () => {
  it('turns any authored underscore run into one semantic blank', () => {
    expect(childPromptParts('Eye is to see as ear is to ____.')).toEqual([
      { kind: 'text', text: 'Eye is to see as ear is to ' },
      { kind: 'blank', text: 'blank' },
      { kind: 'text', text: '.' }
    ]);
    expect(childPromptParts('A __ B ______ C')).toEqual([
      { kind: 'text', text: 'A ' },
      { kind: 'blank', text: 'blank' },
      { kind: 'text', text: ' B ' },
      { kind: 'blank', text: 'blank' },
      { kind: 'text', text: ' C' }
    ]);
  });

  it('speaks each blank once instead of reading underscores', () => {
    expect(childPromptSpeechText('Eye is to see as ear is to ____.'))
      .toBe('Eye is to see as ear is to blank.');
    expect(childPromptSpeechText('Put ___ here, then ____ there!'))
      .toBe('Put blank here, then blank there!');
  });

  it('does not rewrite an ordinary single underscore', () => {
    expect(childPromptSpeechText('row_id stays intact')).toBe('row_id stays intact');
    expect(childPromptParts('row_id stays intact')).toEqual([
      { kind: 'text', text: 'row_id stays intact' }
    ]);
  });
});
