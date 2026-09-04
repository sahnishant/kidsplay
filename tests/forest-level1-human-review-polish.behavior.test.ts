import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('Forest Level-1 human-review polish', () => {
  it('keeps the Forest mission inside a dedicated environmental child surface', () => {
    const app = source('src/App.svelte');
    const css = source('src/forestSessionPolish.css');

    expect(app).toContain("activeStoryMission?.id === 'mission.forest-explorer-trail'");
    expect(app).toContain("activeStoryLocation?.id === 'forest'");
    expect(app).toContain('class:forest-session-host={forestLevelOneSession}');
    expect(css).toContain('.forest-session-host .session-viewport');
    expect(css).toContain('.forest-session-host .feedback--correct');
    expect(css).toContain('.forest-session-host .next-button');
  });

  it('keeps hidden and revealed memory cards bounded while allowing complete clue text at phone width', () => {
    const engine = source('src/engines/MemoryPairs.svelte');
    const presenter = source('src/presentation/SemanticVisualPresenter.svelte');
    const css = source('src/interactionStyles.css');

    expect(css).toMatch(/\.memory-card\s*\{[^}]*height:\s*118px/s);
    expect(css).toMatch(/@media \(max-width: 480px\)[\s\S]*\.memory-card\s*\{[^}]*height:\s*102px/s);
    expect(css).toMatch(/\.memory-card\s*\{[^}]*overflow:\s*hidden/s);
    expect(engine).toMatch(/height:38px[^\"]*min-width:0[^\"]*overflow:hidden/);
    expect(engine).toMatch(/height:36px[^\"]*min-width:0[^\"]*overflow:hidden/);
    expect(css).toMatch(/\.memory-card__label\s*\{[^}]*max-height:\s*4\.5em[^}]*overflow-y:\s*auto/s);
    expect(css).toMatch(/\.memory-card__label\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(css).toMatch(/\.memory-card__label\s*\{[^}]*touch-action:\s*pan-y/s);
    expect(css).not.toContain('-webkit-line-clamp');
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

  it('keeps child speech offline-only while preferring child-friendly voices and retrying late mobile readiness', () => {
    const audio = source('src/runtime/childAudio.ts');
    const android = source('src/runtime/androidOfflineSpeech.ts');

    expect(audio).toContain('CHILD_FRIENDLY_VOICE_HINTS');
    expect(audio).toContain("'child'");
    expect(audio).toContain("'young'");
    expect(audio).toContain('voice.localService === true');
    expect(audio).toContain('VOICE_READY_RETRY_DELAYS_MS = [120, 360, 850]');
    expect(audio).toContain("synthesis.addEventListener('voiceschanged'");
    expect(audio).toContain("path.includes('://')");
    expect(android).toContain('READY_RETRY_DELAYS_MS = [0, 120, 360, 850]');
    expect(android).toContain('status.hasOfflineVoice');
    expect(android).toContain("capacitor.getPlatform?.() === 'android'");
  });

  it('makes correct feedback an explicit celebratory check rather than a passive result panel', () => {
    const host = source('src/ui/EngineHost.svelte');
    const session = source('src/ui/SessionViewport.svelte');
    const visual = source('src/runtime/answerFeedbackVisual.ts');

    expect(host).toContain('showAnswerFeedbackSplash(result.correct)');
    expect(host).toContain("feedbackMode === 'play'");
    expect(session).toContain("feedback--${sessionState.lastResult.correct ? 'correct' : 'incorrect'}");
    expect(session).toContain("mood={sessionState.lastResult?.correct ? 'celebrate' : 'thinking'}");
    expect(visual).toContain('kidsplay-answer-splash--correct');
    expect(visual).toContain("icon.textContent = correct ? '✓' : '↻'");
    expect(visual).toContain("label.textContent = correct ? 'Great!' : 'Try again'");
    expect(visual).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
