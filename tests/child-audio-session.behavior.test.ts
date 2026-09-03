import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { SingleChoiceQuestion } from '../src/contracts/question';
import { loadChildAudioPreferences, stopChildAudio } from '../src/runtime/childAudio';
import Session from '../src/ui/SessionViewport.svelte';

class MockUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;

  constructor(text: string) {
    this.text = text;
  }
}

function offlineVoice(): SpeechSynthesisVoice {
  return {
    default: true,
    lang: 'en-IN',
    localService: true,
    name: 'Kidsplay Offline English',
    voiceURI: 'kidsplay-offline-en'
  } as SpeechSynthesisVoice;
}

function installOfflineSpeech() {
  const spoken: MockUtterance[] = [];
  const synthesis = {
    cancel: vi.fn(),
    speak: vi.fn((utterance: MockUtterance) => spoken.push(utterance)),
    getVoices: vi.fn(() => [offlineVoice()]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synthesis });
  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
  return { synthesis, spoken };
}

function choiceQuestion(id = 'test.audio.choice'): SingleChoiceQuestion {
  return {
    id,
    revision: 1,
    schemaVersion: 1,
    conceptIds: ['test.audio'],
    knowledgeRefs: ['kr.test.audio'],
    difficulty: 1,
    language: 'en-IN',
    prompt: { text: 'Which animal says woof?' },
    feedback: { correct: 'Correct.', incorrect: 'Try again.' },
    authoring: { status: 'reviewed', source: 'audio-session-test' },
    interaction: {
      type: 'single_choice',
      version: 1,
      shuffleOptions: false,
      options: [
        { id: 'dog', label: 'Dog' },
        { id: 'fish', label: 'Fish' }
      ]
    },
    solution: { type: 'exact_option', correctOptionIds: ['dog'] }
  };
}

beforeEach(() => {
  window.localStorage.clear();
  installOfflineSpeech();
});

afterEach(() => {
  cleanup();
  stopChildAudio();
  vi.unstubAllGlobals();
  document.querySelector('[data-answer-feedback]')?.remove();
});

describe('Phase C child audio session controls', () => {
  it('reads a fresh question automatically and repeats it on demand', async () => {
    const synthesis = window.speechSynthesis as unknown as { speak: ReturnType<typeof vi.fn> };
    render(Session, { props: { title: 'Audio trail', questions: [choiceQuestion()] } });

    await waitFor(() => expect(synthesis.speak).toHaveBeenCalledTimes(1));
    const first = synthesis.speak.mock.calls[0][0] as MockUtterance;
    expect(first.text).toBe('Which animal says woof?');

    await fireEvent.click(screen.getByRole('button', { name: 'Repeat question' }));
    expect(synthesis.speak).toHaveBeenCalledTimes(2);
    const repeated = synthesis.speak.mock.calls[1][0] as MockUtterance;
    expect(repeated.text).toBe(first.text);
  });

  it('persists sound off and restores the same state in the next session', async () => {
    const first = render(Session, { props: { title: 'Audio trail', questions: [choiceQuestion()] } });
    await fireEvent.click(screen.getByRole('button', { name: 'Turn sound off' }));

    expect(loadChildAudioPreferences()).toEqual({ version: 1, enabled: false });
    expect((screen.getByRole('button', { name: 'Repeat question' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Turn sound on' }).getAttribute('aria-pressed')).toBe('false');

    first.unmount();
    render(Session, { props: { title: 'Another trail', questions: [choiceQuestion('test.audio.choice-2')] } });

    expect(screen.getByRole('button', { name: 'Turn sound on' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Repeat question' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('cancels prompt narration on submit before normal answer feedback proceeds', async () => {
    const synthesis = window.speechSynthesis as unknown as { cancel: ReturnType<typeof vi.fn> };
    render(Session, { props: { title: 'Audio trail', questions: [choiceQuestion()] } });

    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));

    expect(synthesis.cancel).toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain('Correct.');
  });

  it('exposes story-character narration through the same offline voice contract', async () => {
    const synthesis = window.speechSynthesis as unknown as { speak: ReturnType<typeof vi.fn> };
    render(Session, {
      props: {
        title: 'Story clue',
        questions: [choiceQuestion()],
        storyCompletion: {
          text: 'The trail is safe again.',
          rewardLabel: 'Forest badge',
          stars: 1
        }
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));
    const hear = screen.getByRole('button', { name: 'Hear Scientu' });
    expect(hear).toBeTruthy();

    const before = synthesis.speak.mock.calls.length;
    await fireEvent.click(hear);
    expect(synthesis.speak).toHaveBeenCalledTimes(before + 1);
    const utterance = synthesis.speak.mock.calls.at(-1)?.[0] as MockUtterance;
    expect(utterance.pitch).toBe(0.96);
    expect(utterance.text).toContain('Final clue checked');
  });

  it('cancels narration before retry and exit transitions', async () => {
    const synthesis = window.speechSynthesis as unknown as {
      cancel: ReturnType<typeof vi.fn>;
      speak: ReturnType<typeof vi.fn>;
    };
    const onExit = vi.fn();
    render(Session, { props: { title: 'Retry trail', questions: [choiceQuestion()], onExit } });
    await waitFor(() => expect(synthesis.speak).toHaveBeenCalledTimes(1));

    await fireEvent.click(screen.getByRole('button', { name: 'Fish' }));
    const afterWrongSubmit = synthesis.cancel.mock.calls.length;
    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(synthesis.cancel.mock.calls.length).toBeGreaterThan(afterWrongSubmit);

    const afterRetry = synthesis.cancel.mock.calls.length;
    await fireEvent.click(screen.getByRole('button', { name: 'Back to Kidsplay home' }));
    expect(synthesis.cancel.mock.calls.length).toBeGreaterThan(afterRetry);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('cancels character narration before advancing to the next clue', async () => {
    const synthesis = window.speechSynthesis as unknown as { cancel: ReturnType<typeof vi.fn> };
    render(Session, {
      props: {
        title: 'Story transition trail',
        questions: [choiceQuestion('test.audio.first'), choiceQuestion('test.audio.second')],
        storyCompletion: {
          text: 'The trail is safe again.',
          rewardLabel: 'Forest badge',
          stars: 1
        }
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Dog' }));
    await fireEvent.click(screen.getByRole('button', { name: /^Hear / }));
    const beforeTransition = synthesis.cancel.mock.calls.length;
    await fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(synthesis.cancel.mock.calls.length).toBeGreaterThan(beforeTransition);
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });
});