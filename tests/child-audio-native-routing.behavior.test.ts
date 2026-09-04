import { afterEach, describe, expect, it, vi } from 'vitest';
import { playQuestionPrompt, stopChildAudio } from '../src/runtime/childAudio';

afterEach(() => {
  stopChildAudio();
  Reflect.deleteProperty(window, 'Capacitor');
  vi.restoreAllMocks();
});

describe('native Android child-audio routing', () => {
  it('reports an installed offline Android voice as pending local playback, never as silent fallback', async () => {
    const plugin = {
      getStatus: vi.fn(async () => ({
        ready: true,
        available: true,
        hasOfflineVoice: true,
        voiceName: 'Android Offline English'
      })),
      speak: vi.fn(async () => ({ voiceName: 'Android Offline English' })),
      stop: vi.fn(async () => undefined),
      openInstall: vi.fn(async () => ({ opened: true }))
    };

    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      value: {
        getPlatform: () => 'android',
        isNativePlatform: () => true,
        isPluginAvailable: (name: string) => name === 'KidsplayOfflineSpeech',
        Plugins: { KidsplayOfflineSpeech: plugin }
      }
    });

    const result = playQuestionPrompt('Read this story page.', 'en-IN');
    expect(result.source).toBe('pending_local_voice');

    await vi.waitFor(() => expect(plugin.speak).toHaveBeenCalledTimes(1));
    expect(plugin.speak).toHaveBeenCalledWith(expect.objectContaining({
      text: 'Read this story page.',
      lang: 'en-IN'
    }));
  });
});
