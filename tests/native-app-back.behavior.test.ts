// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { installAppBackNavigation, pushAppBackLayer, NATIVE_APP_BACK_EVENT, hasAppBackLayer } from '../src/runtime/appNavigation';
import { patchAndroidBackNavigation } from '../scripts/install-android-navigation.mjs';

let cleanup: (() => void) | undefined;
afterEach(() => { cleanup?.(); cleanup = undefined; vi.restoreAllMocks(); });

describe('native Back joins the shared app history', () => {
  it('cancels native fallback for an app layer and consumes that layer on popstate', () => {
    cleanup = installAppBackNavigation();
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const close = vi.fn(); pushAppBackLayer('test.studio', close);
    expect(window.dispatchEvent(new Event(NATIVE_APP_BACK_EVENT, { cancelable: true }))).toBe(false);
    expect(back).toHaveBeenCalledTimes(1); expect(close).not.toHaveBeenCalled();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(close).toHaveBeenCalledTimes(1); expect(hasAppBackLayer()).toBe(false);
  });
  it('does not consume root Back or keep a listener after teardown', () => {
    cleanup = installAppBackNavigation();
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    expect(window.dispatchEvent(new Event(NATIVE_APP_BACK_EVENT, { cancelable: true }))).toBe(true);
    pushAppBackLayer('test.studio', vi.fn()); cleanup();
    expect(window.dispatchEvent(new Event(NATIVE_APP_BACK_EVENT, { cancelable: true }))).toBe(true);
    expect(back).not.toHaveBeenCalled();
  });
  it('registers one native event listener across repeated install attempts', () => {
    cleanup = installAppBackNavigation(); const duplicate = installAppBackNavigation();
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    pushAppBackLayer('test.studio', vi.fn()); duplicate();
    window.dispatchEvent(new Event(NATIVE_APP_BACK_EVENT, { cancelable: true }));
    expect(back).toHaveBeenCalledTimes(1);
  });
});

describe('generated Android Back registration', () => {
  const source = 'package com.kidsplay.app;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { public void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); } }';
  it('adds one registration after bridge creation and remains idempotent', () => {
    const patched = patchAndroidBackNavigation(source);
    expect(patchAndroidBackNavigation(patched)).toBe(patched);
    expect(patched.match(/KidsplayBackNavigation.install\(this\)/g)).toHaveLength(1);
    expect(patched.indexOf('super.onCreate')).toBeLessThan(patched.indexOf('KidsplayBackNavigation.install'));
  });
  it.each(['', source.replace('super.onCreate(savedInstanceState);', ''), source + '\nsuper.onCreate(savedInstanceState);'])('refuses ambiguous or missing lifecycle anchors', (input) => {
    expect(() => patchAndroidBackNavigation(input)).toThrow();
  });
  it('keeps native handling lifecycle-bound with timeout, reentry and root fallback guards', () => {
    const java = readFileSync(resolve('native/android/KidsplayBackNavigation.java'), 'utf8');
    expect(java).toContain('addCallback(activity, new OnBackPressedCallback(true)');
    expect(java).toContain(NATIVE_APP_BACK_EVENT);
    expect(java).toContain('setEnabled(false)');
    expect(java).toContain('token != request');
    expect(java).toContain('handler.postDelayed(timeout, 1500)');
    expect(java).not.toContain('localStorage');
  });
});
