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

interface NativeCapacitorRuntime {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
  isPluginAvailable?: (name: string) => boolean;
  registerPlugin?: <T>(name: string) => T;
  Plugins?: Record<string, unknown>;
}

type CapacitorWindow = Window & typeof globalThis & {
  Capacitor?: NativeCapacitorRuntime;
};

const READY_RETRY_DELAYS_MS = [0, 120, 360, 850] as const;
let speechGeneration = 0;
let cachedPlugin: KidsplayOfflineSpeechPlugin | undefined;

function pause(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function getCapacitorRuntime(): NativeCapacitorRuntime | null {
  if (typeof window === 'undefined') return null;
  return (window as CapacitorWindow).Capacitor ?? null;
}

function getNativeSpeech(): KidsplayOfflineSpeechPlugin | null {
  if (cachedPlugin) return cachedPlugin;
  const capacitor = getCapacitorRuntime();
  if (!capacitor || !isAndroidOfflineSpeechRuntime()) return null;
  try {
    if (capacitor.isPluginAvailable?.('KidsplayOfflineSpeech') === false) return null;
    const existing = capacitor.Plugins?.KidsplayOfflineSpeech as KidsplayOfflineSpeechPlugin | undefined;
    const plugin = existing ?? capacitor.registerPlugin?.<KidsplayOfflineSpeechPlugin>('KidsplayOfflineSpeech');
    if (plugin) cachedPlugin = plugin;
    return plugin ?? null;
  } catch {
    return null;
  }
}

export function isAndroidOfflineSpeechRuntime(): boolean {
  const capacitor = getCapacitorRuntime();
  return capacitor?.isNativePlatform?.() === true && capacitor.getPlatform?.() === 'android';
}

export async function getAndroidOfflineSpeechStatus(
  language: string
): Promise<AndroidOfflineSpeechStatus | null> {
  if (!isAndroidOfflineSpeechRuntime()) return null;
  const nativeSpeech = getNativeSpeech();
  if (!nativeSpeech) return null;

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
  const nativeSpeech = getNativeSpeech();
  if (!nativeSpeech) return { spoken: false };
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
  if (!isAndroidOfflineSpeechRuntime() || !getNativeSpeech()) return false;
  void speakAndroidOffline(request);
  return true;
}

export async function stopAndroidOfflineSpeech(): Promise<void> {
  speechGeneration += 1;
  if (!isAndroidOfflineSpeechRuntime()) return;
  try {
    await getNativeSpeech()?.stop();
  } catch {
    // Audio teardown must never block child navigation.
  }
}

export async function openAndroidOfflineVoiceInstaller(): Promise<boolean> {
  if (!isAndroidOfflineSpeechRuntime()) return false;
  try {
    return (await getNativeSpeech()?.openInstall())?.opened === true;
  } catch {
    return false;
  }
}
