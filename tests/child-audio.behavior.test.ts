import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isBundledChildAudioPath,
  loadChildAudioPreferences,
  playCharacterNarration,
  playPhonemeAudio,
  playQuestionPrompt,
  playVocabularyAudio,
  saveChildAudioPreferences,
  selectOfflineSpeechVoice,
  stopChildAudio
} from '../src/runtime/childAudio';

function voice(name: string, lang: string, localService: boolean): SpeechSynthesisVoice {
  return {
    default: false,
    lang,
    localService,
    name,
    voiceURI: name
  } as SpeechSynthesisVoice;
}

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

function installSpeechSynthesis(voices: SpeechSynthesisVoice[]) {
  const spoken: MockUtterance[] = [];
  const synthesis = {
    cancel: vi.fn(),
    speak: vi.fn((utterance: MockUtterance) => spoken.push(utterance)),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: synthesis
  });
  vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
  return { synthesis, spoken };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  stopChildAudio();
  vi.unstubAllGlobals();
});

describe('Phase C offline child audio runtime', () => {
  it('persists the master sound setting locally and defaults safely after corrupt data', () => {
    expect(loadChildAudioPreferences()).toEqual({ version: 1, enabled: true });
    expect(saveChildAudioPreferences(false)).toEqual({ version: 1, enabled: false });
    expect(loadChildAudioPreferences()).toEqual({ version: 1, enabled: false });

    window.localStorage.setItem('kidsplay.audio.v1', '{bad-json');
    expect(loadChildAudioPreferences()).toEqual({ version: 1, enabled: true });
  });

  it('accepts only packaged /audio paths and rejects every remote or indirect source form', () => {
    expect(isBundledChildAudioPath('/audio/prompts/animals-001.wav')).toBe(true);
    expect(isBundledChildAudioPath('/audio/vocabulary/dog.mp3')).toBe(true);
    expect(isBundledChildAudioPath('https://example.com/dog.mp3')).toBe(false);
    expect(isBundledChildAudioPath('//example.com/dog.mp3')).toBe(false);
    expect(isBundledChildAudioPath('/audio/../remote.mp3')).toBe(false);
    expect(isBundledChildAudioPath('/audio/%2e%2e/remote.mp3')).toBe(false);
    expect(isBundledChildAudioPath('/audio\\..\\remote.mp3')).toBe(false);
    expect(isBundledChildAudioPath('/audio/dog.mp3?cache=1')).toBe(false);
    expect(isBundledChildAudioPath('data:audio/wav;base64,AAAA')).toBe(false);
  });

  it('never selects a speech voice unless the browser explicitly marks it localService', () => {
    const remoteExact = voice('Remote exact', 'en-IN', false);
    const localLanguage = voice('Offline English', 'en-GB', true);
    const localWrongLanguage = voice('Offline Hindi', 'hi-IN', true);

    expect(selectOfflineSpeechVoice([remoteExact, localLanguage, localWrongLanguage], 'en-IN')).toBe(localLanguage);
    expect(selectOfflineSpeechVoice([remoteExact, localWrongLanguage], 'en-IN')).toBeNull();
  });

  it('refuses remote-only TTS instead of silently using an online voice', () => {
    const { synthesis } = installSpeechSynthesis([voice('Cloud English', 'en-IN', false)]);
    const result = playQuestionPrompt('Which animal lives in a kennel?', 'en-IN');

    expect(result.source).toBe('unavailable');
    expect(synthesis.speak).not.toHaveBeenCalled();
  });

  it('speaks prompts and vocabulary through a matching offline voice', () => {
    const offline = voice('Offline English', 'en-IN', true);
    const { spoken } = installSpeechSynthesis([offline]);

    expect(playQuestionPrompt('Choose the dog.', 'en-IN').source).toBe('local_voice');
    expect(spoken.at(-1)?.text).toBe('Choose the dog.');
    expect(spoken.at(-1)?.voice).toBe(offline);
    expect(spoken.at(-1)?.rate).toBe(0.9);

    expect(playVocabularyAudio('dog', 'en-IN').source).toBe('local_voice');
    expect(spoken.at(-1)?.text).toBe('dog');
    expect(spoken.at(-1)?.rate).toBeLessThan(0.9);
  });

  it('keeps phoneme playback authored and slower rather than deriving speech from notation', () => {
    installSpeechSynthesis([voice('Offline English', 'en-IN', true)]);
    const synthesis = window.speechSynthesis as unknown as { speak: ReturnType<typeof vi.fn> };

    expect(playPhonemeAudio('sh', 'en-IN').source).toBe('local_voice');
    const utterance = synthesis.speak.mock.calls.at(-1)?.[0] as MockUtterance;
    expect(utterance.text).toBe('sh');
    expect(utterance.rate).toBe(0.68);
  });

  it('provides distinct Dheu, Scientu and Shaitanu narration hooks over the same offline voice', () => {
    const { spoken } = installSpeechSynthesis([voice('Offline English', 'en-IN', true)]);

    expect(playCharacterNarration('dheu', 'Come with me!', 'en-IN').source).toBe('local_voice');
    const dheu = spoken.at(-1)!;
    expect(playCharacterNarration('scientu', 'Look at the clue.', 'en-IN').source).toBe('local_voice');
    const scientu = spoken.at(-1)!;
    expect(playCharacterNarration('shaitanu', 'I mixed them up!', 'en-IN').source).toBe('local_voice');
    const shaitanu = spoken.at(-1)!;

    expect(dheu.pitch).not.toBe(scientu.pitch);
    expect(scientu.pitch).not.toBe(shaitanu.pitch);
    expect(dheu.rate).not.toBe(shaitanu.rate);
  });

  it('returns muted and cancels in-flight narration when the master gate is off', () => {
    const { synthesis } = installSpeechSynthesis([voice('Offline English', 'en-IN', true)]);
    const result = playQuestionPrompt('Do not speak this.', 'en-IN', false);

    expect(result.source).toBe('muted');
    expect(synthesis.cancel).toHaveBeenCalled();
    expect(synthesis.speak).not.toHaveBeenCalled();
  });
});