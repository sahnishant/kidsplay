import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { validateRecord, validateSuite } from './validate-android-beta-evidence.mjs';

const REQUIRED_REPOSITORY = 'sahnishant/kidsplay';
const REQUIRED_EVENT = 'push';
const REQUIRED_REF = 'refs/heads/main';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseArgs(argv) {
  const options = {
    file: null,
    dir: null,
    releaseIdentity: null,
    apk: null,
    requireCompleteSuite: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file') options.file = argv[++index];
    else if (arg.startsWith('--file=')) options.file = arg.slice('--file='.length);
    else if (arg === '--dir') options.dir = argv[++index];
    else if (arg.startsWith('--dir=')) options.dir = arg.slice('--dir='.length);
    else if (arg === '--release-identity') options.releaseIdentity = argv[++index];
    else if (arg.startsWith('--release-identity=')) options.releaseIdentity = arg.slice('--release-identity='.length);
    else if (arg === '--apk') options.apk = argv[++index];
    else if (arg.startsWith('--apk=')) options.apk = arg.slice('--apk='.length);
    else if (arg === '--require-complete-suite') options.requireCompleteSuite = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if ((options.file && options.dir) || (!options.file && !options.dir)) {
    throw new Error('Use exactly one of --file <path> or --dir <path>');
  }
  if (!options.releaseIdentity) {
    throw new Error('Use --release-identity <path> with the workflow-generated Android beta release identity');
  }
  if (!options.apk) {
    throw new Error('Use --apk <path> with the exact downloaded APK selected for physical testing');
  }

  return options;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function loadRecords(options) {
  if (options.file) {
    const path = resolve(options.file);
    return [{ record: loadJson(path), label: path }];
  }

  const directory = resolve(options.dir);
  const releaseIdentityPath = resolve(options.releaseIdentity);
  if (!statSync(directory).isDirectory()) throw new Error(`${directory} is not a directory`);
  return readdirSync(directory)
    .filter((name) => {
      const path = resolve(directory, name);
      return name.endsWith('.json') && name !== 'template.json' && path !== releaseIdentityPath;
    })
    .sort()
    .map((name) => {
      const path = resolve(directory, name);
      return { record: loadJson(path), label: path };
    });
}

export function validateReleaseIdentityBinding(records, identity, identityLabel = 'release identity') {
  const errors = [];

  if (!isObject(identity)) {
    return [`${identityLabel}: root must be an object`];
  }
  if (identity.schemaVersion !== 1) {
    errors.push(`${identityLabel}: schemaVersion must be 1`);
  }
  if (identity.issue !== 33) {
    errors.push(`${identityLabel}: issue must be 33`);
  }
  if (!isObject(identity.release)) {
    errors.push(`${identityLabel}: release is required`);
    return errors;
  }

  for (const { record, label } of records) {
    if (!isObject(record?.release) || !isDeepStrictEqual(record.release, identity.release)) {
      errors.push(`${label}: release must exactly match the workflow-generated Android beta release identity`);
    }
  }

  return errors;
}

export function validateMainReleaseSource(identity, identityLabel = 'release identity') {
  if (!isObject(identity?.source)) {
    return [`${identityLabel}: source is required to prove the Android candidate came from main`];
  }

  const errors = [];
  if (identity.source.repository !== REQUIRED_REPOSITORY) {
    errors.push(`${identityLabel}: source.repository must be ${REQUIRED_REPOSITORY}`);
  }
  if (identity.source.event !== REQUIRED_EVENT) {
    errors.push(`${identityLabel}: source.event must be ${REQUIRED_EVENT}`);
  }
  if (identity.source.ref !== REQUIRED_REF) {
    errors.push(`${identityLabel}: source.ref must be ${REQUIRED_REF}`);
  }
  return errors;
}

export function validateApkBinding(identity, apkSha256, apkLabel = 'APK') {
  const expectedSha256 = identity?.release?.apk?.sha256;
  if (typeof expectedSha256 !== 'string') {
    return [`${apkLabel}: workflow-generated release identity is missing release.apk.sha256`];
  }
  if (apkSha256 !== expectedSha256.toLowerCase()) {
    return [`${apkLabel}: downloaded APK SHA-256 does not match the workflow-generated Android beta release identity`];
  }
  return [];
}

function main() {
  let options;
  let records;
  let identity;
  let identityPath;
  let apkPath;
  let apkSha256;

  try {
    options = parseArgs(process.argv.slice(2));
    records = loadRecords(options);
    identityPath = resolve(options.releaseIdentity);
    identity = loadJson(identityPath);
    apkPath = resolve(options.apk);
    apkSha256 = sha256File(apkPath);
  } catch (error) {
    console.error(`Android beta release binding validation failed: ${error.message}`);
    process.exit(1);
  }

  const evidenceErrors = options.requireCompleteSuite
    ? validateSuite(records)
    : records.flatMap(({ record, label }) => validateRecord(record, label));
  const bindingErrors = validateReleaseIdentityBinding(records, identity, identityPath);
  const sourceErrors = validateMainReleaseSource(identity, identityPath);
  const apkBindingErrors = validateApkBinding(identity, apkSha256, apkPath);
  const errors = [...evidenceErrors, ...bindingErrors, ...sourceErrors, ...apkBindingErrors];

  if (errors.length) {
    console.error(`Android beta release binding validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  if (options.requireCompleteSuite) {
    console.log(`Android beta release binding OK: ${records.length} physical-device record(s) and the downloaded APK match a workflow-generated main-push release identity.`);
  } else {
    console.log(`Android beta release binding OK: ${records.length} record(s) and the downloaded APK match a workflow-generated main-push release identity.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-android-beta-release-binding.mjs')) {
  main();
}
