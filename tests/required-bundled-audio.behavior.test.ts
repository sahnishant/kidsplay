import { afterEach, describe, expect, it, vi } from 'vitest';
import { playRequiredBundledAudio, stopChildAudio } from '../src/runtime/childAudio';

afterEach(() => {
  stopChildAudio();
  vi.unstubAllGlobals();
});

describe('required bundled audio gate', () => {
  it('resolves true only after the exact app-local media play promise succeeds', async () => {
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    const AudioMock = vi.fn(function AudioMock(this: Record<string, unknown>, src: string) {
      this.src = src;
      this.preload = '';
      this.currentTime = 0;
      this.play = play;
      this.pause = pause;
    });
    vi.stubGlobal('Audio', AudioMock);

    await expect(playRequiredBundledAudio('/audio/kidsplay-v1/prereader/phoneme-m.ogg')).resolves.toBe(true);
    expect(AudioMock).toHaveBeenCalledWith('/audio/kidsplay-v1/prereader/phoneme-m.ogg');
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the browser refuses playback instead of falling through to TTS', async () => {
    const play = vi.fn(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')));
    const AudioMock = vi.fn(function AudioMock(this: Record<string, unknown>, src: string) {
      this.src = src;
      this.preload = '';
      this.currentTime = 0;
      this.play = play;
      this.pause = vi.fn();
    });
    vi.stubGlobal('Audio', AudioMock);

    await expect(playRequiredBundledAudio('/audio/kidsplay-v1/prereader/phoneme-f.ogg')).resolves.toBe(false);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('rejects remote, traversal and muted requests before constructing media', async () => {
    const AudioMock = vi.fn();
    vi.stubGlobal('Audio', AudioMock);

    await expect(playRequiredBundledAudio('https://example.com/phoneme-s.ogg')).resolves.toBe(false);
    await expect(playRequiredBundledAudio('/audio/../secret.ogg')).resolves.toBe(false);
    await expect(playRequiredBundledAudio('/audio/kidsplay-v1/prereader/phoneme-s.ogg', false)).resolves.toBe(false);
    expect(AudioMock).not.toHaveBeenCalled();
  });
});
