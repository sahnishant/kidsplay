import {
  isAndroidOfflineSpeechRuntime,
  startAndroidOfflineSpeech,
  stopAndroidOfflineSpeech
} from './androidOfflineSpeech';

export type ChildAudioChannel = 'prompt' | 'character' | 'vocabulary' | 'phoneme';
export type ChildAudioCharacter = 'dheu' | 'scientu' | 'shaitanu';
export type ChildAudioPlaybackSource =
  | 'bundled'
  | 'local_voice'
  | 'pending_local_voice'
  | 'silent_fallback'
  | 'muted'
  | 'unavailable';

export interface ChildAudioPreferences {
  version: 1;
  enabled: boolean;
}

export interface ChildAudioRequest {
  channel: ChildAudioChannel;
  text: string;
  language: string;
  enabled?: boolean;
  character?: ChildAudioCharacter;
  /**
   * Optional app-bundled recording. Only /audio/** paths are accepted so the
   * required child experience can never fall through to a remote media URL.
   */
  bundledSrc?: string;
}

export interface ChildAudioPlaybackResult {
  source: ChildAudioPlaybackSource;
  voiceName?: string;
}

type BrowserAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type Tone = readonly [frequency: number, startOffset: number, duration: number];

type VoiceProfile = {
  rate: number;
  pitch: number;
};

const AUDIO_PREFERENCES_KEY = 'kidsplay.audio.v1';
const DEFAULT_PREFERENCES: ChildAudioPreferences = { version: 1, enabled: true };

const VOICE_PROFILES: Record<ChildAudioChannel | ChildAudioCharacter, VoiceProfile> = {
  prompt: { rate: 0.84, pitch: 1.16 },
  character: { rate: 0.86, pitch: 1.15 },
  vocabulary: { rate: 0.74, pitch: 1.08 },
  phoneme: { rate: 0.66, pitch: 1.08 },
  dheu: { rate: 0.88, pitch: 1.22 },
  scientu: { rate: 0.82, pitch: 1.1 },
  shaitanu: { rate: 0.94, pitch: 0.98 }
};

const CHILD_FRIENDLY_VOICE_HINTS = [
  'child',
  'young',
  'aria',
  'ava',
  'samantha',
  'susan',
  'zira',
  'hazel',
  'female',
  'natural'
] as const;

const VOICE_READY_RETRY_DELAYS_MS = [120, 360, 850] as const;

let audioContext: AudioContext | null = null;
let activeMedia: HTMLAudioElement | null = null;
let voiceListenerCleanup: (() => void) | null = null;
let voiceRetryTimers: Array<ReturnType<typeof setTimeout>> = [];
let playbackGeneration = 0;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadChildAudioPreferences(): ChildAudioPreferences {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_PREFERENCES };
  try {
    const raw = storage.getItem(AUDIO_PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<ChildAudioPreferences> | null;
    return {
      version: 1,
      enabled: typeof parsed?.enabled === 'boolean' ? parsed.enabled : DEFAULT_PREFERENCES.enabled
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveChildAudioPreferences(enabled: boolean): ChildAudioPreferences {
  const preferences: ChildAudioPreferences = { version: 1, enabled };
  const storage = getStorage();
  if (!storage) return preferences;
  try {
    storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Restricted/private storage must never block the child session.
  }
  return preferences;
}

/**
 * Accept only app-local recordings placed below public/audio. Protocols,
 * protocol-relative URLs, traversal and query/hash indirection are rejected.
 */
export function isBundledChildAudioPath(value: string | undefined): value is string {
  if (!value) return false;
  const path = value.trim();
  if (!path.startsWith('/audio/')) return false;
  if (path.includes('\\') || path.includes('://') || path.includes('?') || path.includes('#')) return false;
  try {
    const decoded = decodeURIComponent(path);
    if (decoded.includes('..') || decoded.includes('\\')) return false;
  } catch {
    return false;
  }
  return path.length > '/audio/'.length;
}

function normalizedLanguage(language: string): string {
  return language.trim().replace('_', '-').toLowerCase();
}

function childFriendlyVoiceScore(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const hintScore = CHILD_FRIENDLY_VOICE_HINTS.reduce(
    (score, hint, index) => score + (name.includes(hint) ? CHILD_FRIENDLY_VOICE_HINTS.length - index : 0),
    0
  );
  return hintScore + (voice.default ? 1 : 0);
}

/**
 * Strict offline voice selection for ordinary browsers. Native Android never
 * reaches this browser path; it uses the native plugin below, which applies the
 * equivalent networkConnectionRequired=false rule to Android Voice objects.
 */
export function selectOfflineSpeechVoice(
  voices: readonly SpeechSynthesisVoice[],
  language: string
): SpeechSynthesisVoice | null {
  const requested = normalizedLanguage(language);
  if (!requested) return null;
  const base = requested.split('-')[0];
  const local = voices.filter((voice) => voice.localService === true);
  const exact = local.filter((voice) => normalizedLanguage(voice.lang) === requested);
  const sameLanguage = local.filter((voice) => normalizedLanguage(voice.lang).split('-')[0] === base);
  const candidates = exact.length ? exact : sameLanguage;
  return [...candidates].sort((left, right) => {
    const scoreDelta = childFriendlyVoiceScore(right) - childFriendlyVoiceScore(left);
    return scoreDelta || left.name.localeCompare(right.name);
  })[0] ?? null;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext?.state === 'closed') audioContext = null;
  const browserWindow = window as BrowserAudioWindow;
  const Constructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  if (!Constructor) return null;
  audioContext ??= new Constructor();
  return audioContext;
}

function scheduleTone(
  context: AudioContext,
  [frequency, startOffset, duration]: Tone,
  gainLevel: number,
  type: OscillatorType
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + startOffset;
  const endAt = startAt + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainLevel, startAt + Math.min(0.025, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.01);
}

function runToneSequence(
  tones: readonly Tone[],
  gainLevel: number,
  type: OscillatorType,
  enabled: boolean
): void {
  if (!enabled) return;
  try {
    const context = getAudioContext();
    if (!context) return;
    const play = () => {
      for (const tone of tones) scheduleTone(context, tone, gainLevel, type);
    };
    if (context.state === 'suspended') {
      void context.resume().then(play).catch(() => undefined);
      return;
    }
    play();
  } catch {
    // Earcons are progressive enhancement only.
  }
}

export function playAnswerCue(correct: boolean, enabled = true): void {
  const tones: readonly Tone[] = correct
    ? [
        [523.25, 0, 0.14],
        [659.25, 0.07, 0.15],
        [783.99, 0.14, 0.17],
        [1046.5, 0.23, 0.22],
        [1318.51, 0.36, 0.18]
      ]
    : [
        [392, 0, 0.11],
        [369.99, 0.07, 0.11],
        [349.23, 0.14, 0.11],
        [329.63, 0.21, 0.12],
        [293.66, 0.29, 0.14],
        [261.63, 0.38, 0.2]
      ];
  runToneSequence(tones, correct ? 0.042 : 0.026, correct ? 'sine' : 'triangle', enabled);
}

export function playCharacterCue(character: ChildAudioCharacter, enabled = true): void {
  const tones: Record<ChildAudioCharacter, readonly Tone[]> = {
    dheu: [[659.25, 0, 0.09], [783.99, 0.07, 0.12]],
    scientu: [[523.25, 0, 0.08], [698.46, 0.07, 0.08], [880, 0.14, 0.1]],
    shaitanu: [[440, 0, 0.08], [392, 0.06, 0.08], [466.16, 0.12, 0.11]]
  };
  runToneSequence(tones[character], 0.018, character === 'shaitanu' ? 'triangle' : 'sine', enabled);
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

function clearVoiceListener(): void {
  voiceListenerCleanup?.();
  voiceListenerCleanup = null;
}

function clearVoiceRetryTimers(): void {
  for (const timer of voiceRetryTimers) clearTimeout(timer);
  voiceRetryTimers = [];
}

export function stopChildAudio(): void {
  playbackGeneration += 1;
  clearVoiceListener();
  clearVoiceRetryTimers();
  if (activeMedia) {
    try {
      activeMedia.pause();
      activeMedia.currentTime = 0;
    } catch {
      // Ignore media teardown failures.
    }
    activeMedia = null;
  }
  void stopAndroidOfflineSpeech();
  try {
    getSpeechSynthesis()?.cancel();
  } catch {
    // Speech cancellation must never affect session navigation.
  }
}

function voiceProfileFor(request: ChildAudioRequest): VoiceProfile {
  if (request.channel === 'character' && request.character) {
    return VOICE_PROFILES[request.character];
  }
  return VOICE_PROFILES[request.channel];
}

function startNativeAndroidVoice(
  request: ChildAudioRequest,
  generation: number
): boolean {
  if (!isAndroidOfflineSpeechRuntime() || generation !== playbackGeneration) return false;
  const profile = voiceProfileFor(request);
  return startAndroidOfflineSpeech({
    text: request.text.trim(),
    language: request.language,
    rate: profile.rate,
    pitch: profile.pitch
  });
}

function speakWithOfflineVoice(
  request: ChildAudioRequest,
  generation: number
): ChildAudioPlaybackResult {
  if (typeof SpeechSynthesisUtterance === 'undefined') return { source: 'unavailable' };
  const synthesis = getSpeechSynthesis();
  if (!synthesis) return { source: 'unavailable' };

  const voice = selectOfflineSpeechVoice(synthesis.getVoices(), request.language);
  if (!voice) return { source: 'unavailable' };

  try {
    if (generation !== playbackGeneration) return { source: 'unavailable' };
    synthesis.resume();
    const utterance = new SpeechSynthesisUtterance(request.text.trim());
    const profile = voiceProfileFor(request);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = 1;
    synthesis.speak(utterance);
    return { source: 'local_voice', voiceName: voice.name };
  } catch {
    return { source: 'unavailable' };
  }
}

function waitForOfflineVoice(
  request: ChildAudioRequest,
  generation: number
): ChildAudioPlaybackResult {
  const synthesis = getSpeechSynthesis();
  if (!synthesis) return { source: 'silent_fallback' };

  clearVoiceListener();
  clearVoiceRetryTimers();

  const trySpeak = () => {
    if (generation !== playbackGeneration) return;
    const result = speakWithOfflineVoice(request, generation);
    if (result.source === 'local_voice') {
      clearVoiceListener();
      clearVoiceRetryTimers();
    }
  };

  if (typeof synthesis.addEventListener === 'function') {
    const onVoicesChanged = () => trySpeak();
    synthesis.addEventListener('voiceschanged', onVoicesChanged);
    voiceListenerCleanup = () => synthesis.removeEventListener('voiceschanged', onVoicesChanged);
  }

  voiceRetryTimers = VOICE_READY_RETRY_DELAYS_MS.map((delay) => setTimeout(trySpeak, delay));
  return { source: 'silent_fallback' };
}

/**
 * Plays narration without any remote fallback. Bundled app audio wins. Native
 * Android then uses the repo-owned TextToSpeech plugin, which accepts only
 * installed voices that do not require a network connection. Other browsers
 * may use Web Speech only when the browser explicitly marks a matching voice
 * localService=true. Missing voice data stays silent so the child is never
 * asked to understand device setup.
 */
export function playChildAudio(request: ChildAudioRequest): ChildAudioPlaybackResult {
  if (request.enabled === false) {
    stopChildAudio();
    return { source: 'muted' };
  }
  if (!request.text.trim()) return { source: 'unavailable' };

  stopChildAudio();
  const generation = playbackGeneration;

  if (isBundledChildAudioPath(request.bundledSrc) && typeof Audio !== 'undefined') {
    try {
      const media = new Audio(request.bundledSrc);
      media.preload = 'auto';
      activeMedia = media;
      void media.play().catch(() => {
        if (generation !== playbackGeneration) return;
        activeMedia = null;
        if (startNativeAndroidVoice(request, generation)) return;
        const result = speakWithOfflineVoice(request, generation);
        if (result.source === 'unavailable') waitForOfflineVoice(request, generation);
      });
      return { source: 'bundled' };
    } catch {
      activeMedia = null;
    }
  }

  if (startNativeAndroidVoice(request, generation)) {
    return { source: 'silent_fallback' };
  }

  const speechResult = speakWithOfflineVoice(request, generation);
  return speechResult.source === 'unavailable'
    ? waitForOfflineVoice(request, generation)
    : speechResult;
}

export function playQuestionPrompt(
  text: string,
  language: string,
  enabled = true,
  bundledSrc?: string
): ChildAudioPlaybackResult {
  return playChildAudio({ channel: 'prompt', text, language, enabled, bundledSrc });
}

export function playCharacterNarration(
  character: ChildAudioCharacter,
  text: string,
  language: string,
  enabled = true,
  bundledSrc?: string
): ChildAudioPlaybackResult {
  if (enabled) playCharacterCue(character, true);
  return playChildAudio({ channel: 'character', character, text, language, enabled, bundledSrc });
}

export function playVocabularyAudio(
  word: string,
  language: string,
  enabled = true,
  bundledSrc?: string
): ChildAudioPlaybackResult {
  return playChildAudio({ channel: 'vocabulary', text: word, language, enabled, bundledSrc });
}

/**
 * spokenText must be an authored pronunciation target (for example "sh" or an
 * approved example word), not an arbitrary IPA symbol that TTS may misread.
 */
export function playPhonemeAudio(
  spokenText: string,
  language: string,
  enabled = true,
  bundledSrc?: string
): ChildAudioPlaybackResult {
  return playChildAudio({ channel: 'phoneme', text: spokenText, language, enabled, bundledSrc });
}
