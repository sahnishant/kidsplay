import { Capacitor, registerPlugin } from '@capacitor/core';

export interface AndroidOfflineSpeechStatus {
  ready: boolean;
  available: boolean;
  hasOfflineVoice: boolean;
  voiceName?: string;
}

export interface AndroidOfflineSpeechRequest {
  text: string;
  language: string;
  rate: number;
  pitch: number;
}

interface KidsplayOfflineSpeechPlugin {
  getStatus(options: { lang: string }): Promise<AndroidOfflineSpeechStatus>;
  speak(options: {
    text: string;
    lang: string;
    rate: number;
    pitch: number;
  }): Promise<{ voiceName?: string }>;
  stop(): Promise<void>;
  openInstall(): Promise<{ opened: boolean }>;
}

const nativeSpeech = registerPlugin<KidsplayOfflineSpeechPlugin>('KidsplayOfflineSpeech');
const READY_RETRY_DELAYS_MS = [0, 120, 360, 850] as const;
let speechGeneration = 0;

function pause(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function isAndroidOfflineSpeechRuntime(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function getAndroidOfflineSpeechStatus(
  language: string
): Promise<AndroidOfflineSpeechStatus | null> {
  if (!isAndroidOfflineSpeechRuntime()) return null;

  let lastStatus: AndroidOfflineSpeechStatus | null = null;
  for (const delayMs of READY_RETRY_DELAYS_MS) {
    if (delayMs > 0) await pause(delayMs);
    try {
      lastStatus = await nativeSpeech.getStatus({ lang: language });
      if (lastStatus.ready) return lastStatus;
    } catch {
      return null;
    }
  }
  return lastStatus;
}

export async function speakAndroidOffline(
  request: AndroidOfflineSpeechRequest
): Promise<{ spoken: boolean; voiceName?: string }> {
  if (!isAndroidOfflineSpeechRuntime()) return { spoken: false };
  const generation = ++speechGeneration;

  const status = await getAndroidOfflineSpeechStatus(request.language);
  if (generation !== speechGeneration) return { spoken: false };
  if (!status?.ready || !status.available || !status.hasOfflineVoice) return { spoken: false };

  try {
    const result = await nativeSpeech.speak({
      text: request.text,
      lang: request.language,
      rate: request.rate,
      pitch: request.pitch
    });
    return generation === speechGeneration
      ? { spoken: true, voiceName: result.voiceName }
      : { spoken: false };
  } catch {
    return { spoken: false };
  }
}

/**
 * Starts the strict native Android fallback without making the synchronous
 * child-audio API wait on TTS initialization. A later stop invalidates the
 * generation so a delayed initialization can never speak after navigation.
 */
export function startAndroidOfflineSpeech(request: AndroidOfflineSpeechRequest): boolean {
  if (!isAndroidOfflineSpeechRuntime()) return false;
  void speakAndroidOffline(request);
  return true;
}

export async function stopAndroidOfflineSpeech(): Promise<void> {
  speechGeneration += 1;
  if (!isAndroidOfflineSpeechRuntime()) return;
  try {
    await nativeSpeech.stop();
  } catch {
    // Audio teardown must never block child navigation.
  }
}

export async function openAndroidOfflineVoiceInstaller(): Promise<boolean> {
  if (!isAndroidOfflineSpeechRuntime()) return false;
  try {
    return (await nativeSpeech.openInstall()).opened;
  } catch {
    return false;
  }
}
