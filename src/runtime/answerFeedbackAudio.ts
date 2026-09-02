type BrowserAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type Tone = readonly [frequency: number, startOffset: number, duration: number];

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (audioContext?.state === 'closed') {
    audioContext = null;
  }

  const browserWindow = window as BrowserAudioWindow;
  const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  audioContext ??= new AudioContextConstructor();
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
  gain.gain.exponentialRampToValueAtTime(
    gainLevel,
    startAt + Math.min(0.025, duration / 3)
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.01);
}

function scheduleAnswerChime(context: AudioContext, correct: boolean): void {
  const tones: readonly Tone[] = correct
    ? [
        [523.25, 0, 0.18],
        [659.25, 0.08, 0.2],
        [783.99, 0.16, 0.22],
        [1046.5, 0.25, 0.27]
      ]
    : [
        [392, 0, 0.15],
        [330, 0.09, 0.16],
        [262, 0.18, 0.18],
        [220, 0.29, 0.22]
      ];

  for (const tone of tones) {
    scheduleTone(context, tone, correct ? 0.035 : 0.028, correct ? 'sine' : 'triangle');
  }
}

/**
 * Plays a short, locally synthesized answer cue. Audio is intentionally optional:
 * unsupported or blocked browser audio must never interrupt grading or navigation.
 */
export function playAnswerFeedback(correct: boolean): void {
  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
      void context.resume()
        .then(() => scheduleAnswerChime(context, correct))
        .catch(() => undefined);
      return;
    }

    scheduleAnswerChime(context, correct);
  } catch {
    // Sound is progressive enhancement; answering must remain fully functional without it.
  }
}
