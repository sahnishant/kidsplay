import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('Forest Level-1 human-review polish', () => {
  it('keeps the Forest mission inside a dedicated environmental child surface', () => {
    const session = source('src/ui/SessionViewport.svelte');
    const css = source('src/forestSessionPolish.css');

    expect(session).toContain("session-story--forest");
    expect(session).toContain('forest-session-host');
    expect(css).toContain('.forest-session-host .session-panel');
    expect(css).toContain('.forest-session-host .question-progress');
    expect(css).toContain('.forest-session-host .next-button');
  });

  it('keeps hidden and revealed memory cards bounded while allowing complete clue text at phone width', () => {
    const engine = source('src/engines/MemoryPairs.svelte');
    const presenter = source('src/presentation/SemanticVisualPresenter.svelte');
    const css = source('src/interactionStyles.css');

    expect(css).toMatch(/\.memory-card\s*\{[^}]*height:\s*118px/s);
    expect(css).toMatch(/@media \(max-width: 480px\)[\s\S]*\.memory-card\s*\{[^}]*height:\s*102px/s);
    expect(css).toMatch(/\.memory-card\s*\{[^}]*overflow:\s*hidden/s);
    expect(engine).toContain('height:38px;min-width:0;min-height:0;overflow:hidden');
    expect(engine).toContain('height:36px;min-width:0;min-height:0;overflow:hidden');
    expect(css).toMatch(/\.memory-card__label\s*\{[^}]*max-height:\s*4\.5em[^}]*overflow-y:\s*auto/s);
    expect(css).toMatch(/\.memory-card__label\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(css).toMatch(/\.memory-card__label\s*\{[^}]*touch-action:\s*pan-y/s);
    expect(engine).not.toContain('-webkit-line-clamp:2');
    expect(engine).toContain('>✓</span>');
    expect(presenter).toContain('style={style || undefined}');
    expect(presenter).toContain('style={itemStyle || undefined}');
  });

  it('gives memory mismatches honest audio feedback without waiting for final submission', () => {
    const engine = source('src/engines/MemoryPairs.svelte');

    expect(engine).toContain('playAnswerCue(false, soundEnabled)');
    expect(engine).toContain("status = 'Those cards do not belong together. Remember them and try again.'");
    expect(engine).toContain('window.setTimeout(() => {');
    expect(engine).toContain('}, 750);');
  });

  it('keeps child speech offline-only while preferring a lighter voice and retrying late mobile voice readiness', () => {
    const audio = source('src/runtime/childAudio.ts');
    const android = source('src/runtime/androidOfflineSpeech.ts');

    expect(audio).toContain("rate: 1.12");
    expect(audio).toContain("pitch: 1.42");
    expect(audio).toContain('preferredVoiceName');
    expect(audio).toContain('voiceschanged');
    expect(audio).toContain('No network playback');
    expect(android).toContain('getOfflineSupport');
  });

  it('makes correct feedback an explicit celebratory check rather than a passive result panel', () => {
    const session = source('src/ui/SessionViewport.svelte');
    const visual = source('src/runtime/answerFeedbackVisual.ts');

    expect(session).toContain('answer-feedback--correct');
    expect(session).toContain('answer-feedback__mark');
    expect(visual).toContain('celebration');
  });
});
