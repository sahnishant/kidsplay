import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const defaultSourceFile = resolve(repoRoot, 'native/android/KidsplayOfflineSpeechPlugin.java');

const pluginImport = 'import com.kidsplay.app.audio.KidsplayOfflineSpeechPlugin;';
const bundleImport = 'import android.os.Bundle;';
const registration = `
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(KidsplayOfflineSpeechPlugin.class);
    super.onCreate(savedInstanceState);
  }
`;

const ttsQueries = [
  'android.intent.action.TTS_SERVICE',
  'android.speech.tts.engine.INSTALL_TTS_DATA'
];

function addImport(source, importLine) {
  if (source.includes(importLine)) return source;
  const bridgeImport = 'import com.getcapacitor.BridgeActivity;';
  if (!source.includes(bridgeImport)) {
    throw new Error('Generated MainActivity no longer imports BridgeActivity; refusing an unsafe patch.');
  }
  return source.replace(bridgeImport, `${bridgeImport}\n${importLine}`);
}

function registerPlugin(source) {
  if (source.includes('registerPlugin(KidsplayOfflineSpeechPlugin.class)')) return source;
  if (!source.includes('public class MainActivity extends BridgeActivity')) {
    throw new Error('Generated MainActivity shape changed; refusing an unsafe offline-speech registration patch.');
  }
  const closingBrace = source.lastIndexOf('}');
  if (closingBrace < 0) throw new Error('Generated MainActivity has no class closing brace.');
  return `${source.slice(0, closingBrace)}${registration}${source.slice(closingBrace)}`;
}

function queryIntent(action) {
  return `        <intent>\n            <action android:name="${action}" />\n        </intent>`;
}

function patchManifest(source) {
  const missing = ttsQueries.filter((action) => !source.includes(action));
  if (!missing.length) return source;

  if (source.includes('<queries>') && source.includes('</queries>')) {
    return source.replace('</queries>', `${missing.map(queryIntent).join('\n')}\n    </queries>`);
  }

  const applicationIndex = source.indexOf('<application');
  if (applicationIndex < 0) {
    throw new Error('Generated AndroidManifest.xml has no application element.');
  }
  const lineStart = source.lastIndexOf('\n', applicationIndex) + 1;
  const queries = `    <queries>\n${missing.map(queryIntent).join('\n')}\n    </queries>\n\n`;
  return `${source.slice(0, lineStart)}${queries}${source.slice(lineStart)}`;
}

export function installAndroidOfflineSpeech({
  androidDir = resolve(repoRoot, 'android'),
  sourceFile = defaultSourceFile
} = {}) {
  if (!existsSync(androidDir)) {
    throw new Error(`Android project is missing at ${androidDir}. Run \`npx cap add android\` first.`);
  }
  if (!existsSync(sourceFile)) throw new Error(`Offline speech plugin source is missing at ${sourceFile}.`);

  const mainActivity = resolve(androidDir, 'app/src/main/java/com/kidsplay/app/MainActivity.java');
  const manifest = resolve(androidDir, 'app/src/main/AndroidManifest.xml');
  const pluginTarget = resolve(
    androidDir,
    'app/src/main/java/com/kidsplay/app/audio/KidsplayOfflineSpeechPlugin.java'
  );

  if (!existsSync(mainActivity)) throw new Error(`Generated MainActivity is missing at ${mainActivity}.`);
  if (!existsSync(manifest)) throw new Error(`Generated AndroidManifest.xml is missing at ${manifest}.`);

  mkdirSync(dirname(pluginTarget), { recursive: true });
  copyFileSync(sourceFile, pluginTarget);

  let activitySource = readFileSync(mainActivity, 'utf8');
  activitySource = addImport(activitySource, bundleImport);
  activitySource = addImport(activitySource, pluginImport);
  activitySource = registerPlugin(activitySource);
  writeFileSync(mainActivity, activitySource, 'utf8');

  const manifestSource = readFileSync(manifest, 'utf8');
  writeFileSync(manifest, patchManifest(manifestSource), 'utf8');

  return { mainActivity, manifest, pluginTarget };
}

function parseAndroidDir(argv) {
  const index = argv.indexOf('--android-dir');
  if (index < 0) return undefined;
  const value = argv[index + 1];
  if (!value) throw new Error('--android-dir requires a path.');
  return resolve(value);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const platform = process.env.CAPACITOR_PLATFORM_NAME;
  if (platform && platform !== 'android') {
    console.log(`[kidsplay-offline-speech] Skipping Capacitor platform ${platform}.`);
  } else {
    const result = installAndroidOfflineSpeech({ androidDir: parseAndroidDir(process.argv.slice(2)) });
    console.log(`[kidsplay-offline-speech] Installed native plugin at ${result.pluginTarget}.`);
  }
}
