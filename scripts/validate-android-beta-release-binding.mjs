import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { validateRecord, validateSuite } from './validate-android-beta-evidence.mjs';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseArgs(argv) {
  const options = {
    file: null,
    dir: null,
    releaseIdentity: null,
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
    else if (arg === '--require-complete-suite') options.requireCompleteSuite = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if ((options.file && options.dir) || (!options.file && !options.dir)) {
    throw new Error('Use exactly one of --file <path> or --dir <path>');
  }
  if (!options.releaseIdentity) {
    throw new Error('Use --release-identity <path> with the workflow-generated Android beta release identity');
  }

  return options;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadRecords(options) {
  if (options.file) {
    const path = resolve(options.file);
    return [{ record: loadJson(path), label: path }];
  }

  const directory = resolve(options.dir);
  if (!statSync(directory).isDirectory()) throw new Error(`${directory} is not a directory`);
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json') && name !== 'template.json')
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

function main() {
  let options;
  let records;
  let identity;
  let identityPath;

  try {
    options = parseArgs(process.argv.slice(2));
    records = loadRecords(options);
    identityPath = resolve(options.releaseIdentity);
    identity = loadJson(identityPath);
  } catch (error) {
    console.error(`Android beta release binding validation failed: ${error.message}`);
    process.exit(1);
  }

  const evidenceErrors = options.requireCompleteSuite
    ? validateSuite(records)
    : records.flatMap(({ record, label }) => validateRecord(record, label));
  const bindingErrors = validateReleaseIdentityBinding(records, identity, identityPath);
  const errors = [...evidenceErrors, ...bindingErrors];

  if (errors.length) {
    console.error(`Android beta release binding validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  if (options.requireCompleteSuite) {
    console.log(`Android beta release binding OK: ${records.length} physical-device record(s) match the exact workflow-generated APK identity.`);
  } else {
    console.log(`Android beta release binding OK: ${records.length} record(s) match the exact workflow-generated APK identity.`);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-android-beta-release-binding.mjs')) {
  main();
}
