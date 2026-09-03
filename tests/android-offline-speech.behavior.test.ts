import { afterEach, describe, expect, it, vi } from 'vitest';

interface MockNativePlugin {
  getStatus: ReturnType<typeof vi.fn>;
  speak: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  openInstall: ReturnType<typeof vi.fn>;
}

function plugin(overrides: Partial<MockNativePlugin> = {}): MockNativePlugin {
  return {
    getStatus: vi.fn().mockResolvedValue({
      ready: true,
      available: true,
      hasOfflineVoice: true,
      voiceName: 'offline-en-IN'
    }),
    speak: vi.fn().mockResolvedValue({ voiceName: 'offline-en-IN' }),
    stop: vi.fn().mockResolvedValue(undefined),
    openInstall: vi.fn().mockResolvedValue({ opened: true }),
    ...overrides
  };
}

async function loadBridge({
  native = true,
  platform = 'android',
  pluginAvailable = true,
  nativePlugin = plugin()
}: {
  native?: boolean;
  platform?: string;
  pluginAvailable?: boolean;
  nativePlugin?: MockNativePlugin;
} = {}) {
  vi.resetModules();
  const registerPlugin = vi.fn(() => nativePlugin);
  Object.assign(window, {
    Capacitor: {
      isNativePlatform: () => native,
      getPlatform: () => platform,
      isPluginAvailable: () => pluginAvailable,
      registerPlugin,
      Plugins: {}
    }
  });
  const bridge = await import('../src/runtime/androidOfflineSpeech');
  return { bridge, nativePlugin, registerPlugin };
}

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  delete (window as Window & { Capacitor?: unknown }).Capacitor;
});

describe('Android strict offline speech bridge', () => {
  it('never invokes the native plugin outside a native Android runtime', async () => {
    const { bridge, nativePlugin, registerPlugin } = await loadBridge({ native: false });

    expect(bridge.isAndroidOfflineSpeechRuntime()).toBe(false);
    expect(await bridge.getAndroidOfflineSpeechStatus('en-IN')).toBeNull();
    expect(await bridge.speakAndroidOffline({ text: 'Hello', language: 'en-IN', rate: 0.8, pitch: 1.1 }))
      .toEqual({ spoken: false });
    expect(await bridge.openAndroidOfflineVoiceInstaller()).toBe(false);
    expect(registerPlugin).not.toHaveBeenCalled();
    expect(nativePlugin.getStatus).not.toHaveBeenCalled();
    expect(nativePlugin.speak).not.toHaveBeenCalled();
  });

  it('fails closed when the generated native bridge does not expose the plugin', async () => {
    const { bridge, registerPlugin } = await loadBridge({ pluginAvailable: false });

    expect(await bridge.getAndroidOfflineSpeechStatus('en-IN')).toBeNull();
    expect(bridge.startAndroidOfflineSpeech({ text: 'Hello', language: 'en-IN', rate: 0.8, pitch: 1.1 })).toBe(false);
    expect(registerPlugin).not.toHaveBeenCalled();
  });

  it('refuses to speak when Android reports no installed offline voice', async () => {
    const nativePlugin = plugin({
      getStatus: vi.fn().mockResolvedValue({
        ready: true,
        available: true,
        hasOfflineVoice: false
      })
    });
    const { bridge } = await loadBridge({ nativePlugin });

    const result = await bridge.speakAndroidOffline({
      text: 'Which animal says woof?',
      language: 'en-IN',
      rate: 0.84,
      pitch: 1.16
    });

    expect(result).toEqual({ spoken: false });
    expect(nativePlugin.speak).not.toHaveBeenCalled();
  });

  it('forwards the authored character delivery profile only after an offline voice is confirmed', async () => {
    const { bridge, nativePlugin, registerPlugin } = await loadBridge();

    const result = await bridge.speakAndroidOffline({
      text: 'Look at the clue.',
      language: 'en-IN',
      rate: 0.82,
      pitch: 1.1
    });

    expect(result).toEqual({ spoken: true, voiceName: 'offline-en-IN' });
    expect(registerPlugin).toHaveBeenCalledTimes(1);
    expect(nativePlugin.speak).toHaveBeenCalledWith({
      text: 'Look at the clue.',
      lang: 'en-IN',
      rate: 0.82,
      pitch: 1.1
    });
  });

  it('waits through bounded native initialization before speaking', async () => {
    vi.useFakeTimers();
    const nativePlugin = plugin({
      getStatus: vi.fn()
        .mockResolvedValueOnce({ ready: false, available: false, hasOfflineVoice: false })
        .mockResolvedValueOnce({ ready: true, available: true, hasOfflineVoice: true, voiceName: 'offline-en-IN' })
    });
    const { bridge } = await loadBridge({ nativePlugin });

    const speaking = bridge.speakAndroidOffline({
      text: 'Ready now.',
      language: 'en-IN',
      rate: 0.84,
      pitch: 1.16
    });
    await vi.advanceTimersByTimeAsync(120);

    expect(await speaking).toEqual({ spoken: true, voiceName: 'offline-en-IN' });
    expect(nativePlugin.getStatus).toHaveBeenCalledTimes(2);
    expect(nativePlugin.speak).toHaveBeenCalledTimes(1);
  });

  it('cancels a delayed native start when child navigation stops audio', async () => {
    vi.useFakeTimers();
    const nativePlugin = plugin({
      getStatus: vi.fn()
        .mockResolvedValueOnce({ ready: false, available: false, hasOfflineVoice: false })
        .mockResolvedValueOnce({ ready: true, available: true, hasOfflineVoice: true, voiceName: 'offline-en-IN' })
    });
    const { bridge } = await loadBridge({ nativePlugin });

    const speaking = bridge.speakAndroidOffline({
      text: 'Do not speak after leaving.',
      language: 'en-IN',
      rate: 0.84,
      pitch: 1.16
    });
    await bridge.stopAndroidOfflineSpeech();
    await vi.advanceTimersByTimeAsync(120);

    expect(await speaking).toEqual({ spoken: false });
    expect(nativePlugin.stop).toHaveBeenCalledTimes(1);
    expect(nativePlugin.speak).not.toHaveBeenCalled();
  });

  it('opens Android voice-data installation only through the native platform helper', async () => {
    const { bridge, nativePlugin } = await loadBridge();

    expect(await bridge.openAndroidOfflineVoiceInstaller()).toBe(true);
    expect(nativePlugin.openInstall).toHaveBeenCalledTimes(1);
  });
});
