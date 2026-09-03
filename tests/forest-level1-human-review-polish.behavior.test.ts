import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('Forest Level-1 human-review polish', () => {
  it('keeps the Forest mission inside a dedicated environmental child surface', () => {
    const app = source('src/App.svelte');
    const css = source('src/forestSessionPolish.css');

    expect(app).toContain("activeStoryMission?.id === 'mission.forest-explorer-trail'");
    expect(app).toContain("activeStoryLocation?.id === 'forest'");
    expect(app).toContain('class:forest-session-host={forestLevelOneSession}');
    expect(css).toContain('.forest-session-host .session-card');
    expect(css).toContain('radial-gradient');
    expect(css).toContain('.forest-session-host .reaction-state__scroll');
    expect(css).toContain('.forest-session-host .next-button');
  });

  it('keeps hidden and revealed memory cards the same bounded size at phone width', () => {
    const engine = source('src/engines/MemoryPairs.svelte');
    const presenter = source('src/presentation/SemanticVisualPresenter.svelte');
    const css = source('src/interactionStyles.css');

    expect(css).toMatch(/\.memory-card\s*\{[^}]*height:\s*118px/s);
    expect(css).toMatch(/@media \(max-width: 480px\)[\s\S]*\.memory-card\s*\{[^}]*height:\s*102px/s);
    expect(css).toMatch(/\.memory-card\s*\{[^}]*overflow:\s*hidden/s);
    expect(engine).toContain('height:50px;min-width:0;overflow:hidden');
    expect(engine).toContain('height:46px;min-width:0;min-height:0;overflow:hidden');
    expect(engine).toContain('-webkit-line-clamp:2');
    expect(engine).toContain('>✓</span>');
    expect(presenter).toContain('style={style || undefined}');
    expect(presenter).toContain('style={itemStyle || undefined}');
  });

  it('gives memory mismatches honest audio feedback without waiting for final submission', () => {
    const engine = source('src/engines/MemoryPairs.svelte');

    expect(engine).toContain("import { playAnswerCue } from '../runtime/childAudio'");
    expect(engine).toContain('playAnswerCue(false, soundEnabled)');
    expect(engine).toContain('playAnswerCue(true, soundEnabled)');
    expect(engine).toContain('Those cards do not belong together. Remember them and try again.');
  });

  it('keeps child speech offline-only while preferring a lighter voice and retrying late mobile voice readiness', () => {
    const audio = source('src/runtime/childAudio.ts');

    expect(audio).toContain('voice.localService === true');
    expect(audio).toContain('CHILD_FRIENDLY_VOICE_HINTS');
    expect(audio).toContain('VOICE_READY_RETRY_DELAYS_MS');
    expect(audio).toContain('synthesis.resume()');
    expect(audio).not.toMatch(/https?:\/\//);
  });

  it('makes correct feedback an explicit celebratory check rather than a passive result panel', () => {
    const feedback = source('src/runtime/answerFeedbackVisual.ts');

    expect(feedback).toContain("icon.textContent = correct ? '✓' : '↻'");
    expect(feedback).toContain("label.textContent = correct ? 'Great!' : 'Try again'");
    expect(feedback).toContain('kidsplay-answer-sparkle');
  });
});
