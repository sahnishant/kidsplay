import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const importLine = 'import com.kidsplay.app.navigation.KidsplayBackNavigation;';
const installLine = 'KidsplayBackNavigation.install(this);';

/** Conservative patch after the existing generated onCreate/speech setup. */
export function patchAndroidBackNavigation(source) {
  if (typeof source !== 'string' || !source.includes('public class MainActivity extends BridgeActivity')) throw new Error('Unknown generated Android activity shape');
  if (source.includes(installLine)) {
    if (!source.includes(importLine) || source.split(installLine).length !== 2) throw new Error('Ambiguous native Back registration');
    return source;
  }
  const anchor = 'super.onCreate(savedInstanceState);';
  if (source.split(anchor).length !== 2 || !source.includes('import com.getcapacitor.BridgeActivity;')) throw new Error('Native Back needs one generated onCreate super call');
  const withImport = source.includes(importLine) ? source : source.replace('import com.getcapacitor.BridgeActivity;', `import com.getcapacitor.BridgeActivity;\n${importLine}`);
  return withImport.replace(anchor, `${anchor}\n    ${installLine}`);
}

export function installAndroidNavigation({ androidDir = resolve(root, 'android') } = {}) {
  const activity = resolve(androidDir, 'app/src/main/java/com/kidsplay/app/MainActivity.java');
  const nativeSource = resolve(root, 'native/android/KidsplayBackNavigation.java');
  const target = resolve(androidDir, 'app/src/main/java/com/kidsplay/app/navigation/KidsplayBackNavigation.java');
  if (!existsSync(activity) || !existsSync(nativeSource)) throw new Error('Generated activity or native Back source is missing');
  const patched = patchAndroidBackNavigation(readFileSync(activity, 'utf8'));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(nativeSource, target);
  writeFileSync(activity, patched, 'utf8');
  return { activity, target };
}
