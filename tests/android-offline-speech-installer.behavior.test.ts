import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installAndroidOfflineSpeech } from '../scripts/install-android-offline-speech.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tempRoots: string[] = [];

function fixtureAndroidProject(): string {
  const root = mkdtempSync(resolve(tmpdir(), 'kidsplay-audio-android-'));
  tempRoots.push(root);
  const mainActivity = resolve(root, 'app/src/main/java/com/kidsplay/app/MainActivity.java');
  const manifest = resolve(root, 'app/src/main/AndroidManifest.xml');
  mkdirSync(dirname(mainActivity), { recursive: true });
  mkdirSync(dirname(manifest), { recursive: true });
  writeFileSync(
    mainActivity,
    `package com.kidsplay.app;\n\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {}\n`,
    'utf8'
  );
  writeFileSync(
    manifest,
    `<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n\n    <application android:label="Kidsplay" />\n</manifest>\n`,
    'utf8'
  );
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Android offline-speech native installation', () => {
  it('patches a generated Capacitor project and remains idempotent across repeated sync hooks', () => {
    const androidDir = fixtureAndroidProject();
    const sourceFile = resolve(repoRoot, 'native/android/KidsplayOfflineSpeechPlugin.java');

    installAndroidOfflineSpeech({ androidDir, sourceFile });
    installAndroidOfflineSpeech({ androidDir, sourceFile });

    const activity = readFileSync(
      resolve(androidDir, 'app/src/main/java/com/kidsplay/app/MainActivity.java'),
      'utf8'
    );
    const manifest = readFileSync(resolve(androidDir, 'app/src/main/AndroidManifest.xml'), 'utf8');
    const installedPlugin = readFileSync(
      resolve(androidDir, 'app/src/main/java/com/kidsplay/app/audio/KidsplayOfflineSpeechPlugin.java'),
      'utf8'
    );

    expect(activity.match(/registerPlugin\(KidsplayOfflineSpeechPlugin\.class\)/g)).toHaveLength(1);
    expect(activity.match(/import android\.os\.Bundle;/g)).toHaveLength(1);
    expect(activity.match(/import com\.kidsplay\.app\.audio\.KidsplayOfflineSpeechPlugin;/g)).toHaveLength(1);
    expect(manifest.match(/android\.intent\.action\.TTS_SERVICE/g)).toHaveLength(1);
    expect(manifest.match(/android\.speech\.tts\.engine\.INSTALL_TTS_DATA/g)).toHaveLength(1);
    expect(installedPlugin).toContain('@CapacitorPlugin(name = "KidsplayOfflineSpeech")');
  });

  it('hard-codes the native offline boundary instead of allowing Android to auto-pick a network voice', () => {
    const source = readFileSync(
      resolve(repoRoot, 'native/android/KidsplayOfflineSpeechPlugin.java'),
      'utf8'
    );

    expect(source).toContain('voice.isNetworkConnectionRequired()');
    expect(source).toContain('TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED');
    expect(source).toContain('textToSpeech.setVoice(voice)');
    expect(source).toContain('TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA');
    expect(source).not.toContain('textToSpeech.setLanguage(');
    expect(source).not.toContain('android.permission.INTERNET');
  });

  it('never falls through from native Android into WebView speech', () => {
    const source = readFileSync(resolve(repoRoot, 'src/runtime/childAudio.ts'), 'utf8');
    const androidGate = source.indexOf('if (nativeAndroid) {', source.indexOf('export function playChildAudio'));
    const browserFallback = source.indexOf('const speechResult = speakWithOfflineVoice', androidGate);

    expect(androidGate).toBeGreaterThan(0);
    expect(browserFallback).toBeGreaterThan(androidGate);
    expect(source.slice(androidGate, browserFallback)).toContain("return { source: 'silent_fallback' }");
  });

  it('binds the installer to every Capacitor sync without adding a generated Android tree to source control', () => {
    const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['capacitor:sync:after']).toBe('node scripts/install-android-offline-speech.mjs');
    expect(packageJson.scripts['android:sync']).toContain('npx cap sync android');
  });
});
