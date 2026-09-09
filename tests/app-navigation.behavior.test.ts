import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installAppBackNavigation,
  pushAppBackLayer,
  requestAppBack
} from '../src/runtime/appNavigation';

function cloneHistoryState(): unknown {
  return JSON.parse(JSON.stringify(window.history.state));
}

function dispatchPopState(state: unknown): void {
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
}

describe('app navigation history bridge', () => {
  let cleanup: () => void;

  beforeEach(() => {
    window.history.replaceState({}, '');
    cleanup = installAppBackNavigation();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.replaceState({}, '');
  });

  it('consumes only the child when browser Back returns to its parent entry', () => {
    const parentBack = vi.fn();
    const childBack = vi.fn();

    pushAppBackLayer('parent', parentBack);
    const parentState = cloneHistoryState();
    pushAppBackLayer('child', childBack);

    dispatchPopState(parentState);

    expect(childBack).toHaveBeenCalledTimes(1);
    expect(parentBack).not.toHaveBeenCalled();
  });

  it('does not consume a live parent when browser Forward revisits a closed child entry', () => {
    const parentBack = vi.fn();
    const childBack = vi.fn();

    pushAppBackLayer('parent', parentBack);
    const parentState = cloneHistoryState();
    pushAppBackLayer('child', childBack);
    const childState = cloneHistoryState();

    dispatchPopState(parentState);
    expect(childBack).toHaveBeenCalledTimes(1);

    dispatchPopState(childState);

    expect(parentBack).not.toHaveBeenCalled();
  });

  it('old disposers cannot remove a newer layer that reuses the same semantic id', () => {
    const rootState = cloneHistoryState();
    const oldBack = vi.fn();
    const currentBack = vi.fn();

    const releaseOld = pushAppBackLayer('learning-session', oldBack);
    pushAppBackLayer('learning-session', currentBack);
    releaseOld();

    dispatchPopState(rootState);

    expect(currentBack).toHaveBeenCalledTimes(1);
    expect(oldBack).not.toHaveBeenCalled();
  });

  it('skips a stale released browser entry while a live parent remains', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const parentBack = vi.fn();
    const childBack = vi.fn();

    pushAppBackLayer('parent', parentBack);
    const parentState = cloneHistoryState();
    const releaseChild = pushAppBackLayer('child', childBack);
    releaseChild();

    dispatchPopState(parentState);

    expect(childBack).not.toHaveBeenCalled();
    expect(parentBack).not.toHaveBeenCalled();
    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('closes the visible live layer directly when browser state no longer represents it', () => {
    const layerBack = vi.fn();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    pushAppBackLayer('child', layerBack);
    window.history.replaceState({}, '');

    expect(requestAppBack()).toBe(true);
    expect(layerBack).toHaveBeenCalledTimes(1);
    expect(historyBack).not.toHaveBeenCalled();
  });

  it('does not steal an Escape key that a child interaction already consumed', () => {
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushAppBackLayer('child', vi.fn());

    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    event.preventDefault();
    window.dispatchEvent(event);

    expect(historyBack).not.toHaveBeenCalled();
  });
});
