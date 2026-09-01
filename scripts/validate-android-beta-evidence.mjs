import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED_JOURNEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const REQUIRED_ROLES = ['small_phone', 'large_phone_or_tablet', 'low_mid_range', 'offline'];
const ALLOWED_ROLES = new Set(REQUIRED_ROLES);
const ALLOWED_SEVERITIES = new Set(['blocker', 'major', 'minor', 'polish']);
const ALLOWED_REPRODUCIBILITY = new Set(['always', 'intermittent', 'once']);
const HEX40 = /^[0-9a-f]{40}$/i;
const HEX64 = /^[0-9a-f]{64}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0 && value !== 'REPLACE_ME';
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function positiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isRealHex(value, pattern) {
  return typeof value === 'string' && pattern.test(value) && !/^0+$/.test(value);
}

function validateDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
}

function add(errors, label, message) {
  errors.push(`${label}: ${message}`);
}

export function validateRecord(record, label = 'record') {
  const errors = [];
  if (!isObject(record)) return [`${label}: root must be an object`];

  if (record.schemaVersion !== 1) add(errors, label, 'schemaVersion must be 1');
  if (record.issue !== 33) add(errors, label, 'issue must be 33');

  const release = record.release;
  if (!isObject(release)) {
    add(errors, label, 'release is required');
  } else {
    if (!isRealHex(release.commitSha, HEX40)) add(errors, label, 'release.commitSha must be a non-placeholder 40-character git SHA');
    if (release.appPackage !== 'com.kidsplay.app') add(errors, label, 'release.appPackage must be com.kidsplay.app');
    if (!isObject(release.apk)) {
      add(errors, label, 'release.apk is required');
    } else {
      if (!positiveInteger(release.apk.workflowRunId)) add(errors, label, 'release.apk.workflowRunId must be a positive integer');
      if (!positiveInteger(release.apk.artifactId)) add(errors, label, 'release.apk.artifactId must be a positive integer');
      if (!isRealHex(release.apk.sha256, HEX64)) add(errors, label, 'release.apk.sha256 must be a non-placeholder 64-character SHA-256');
    }
  }

  const tester = record.tester;
  if (!isObject(tester)) {
    add(errors, label, 'tester is required');
  } else {
    if (!nonEmptyString(tester.name)) add(errors, label, 'tester.name is required');
    if (!validateDate(tester.testedAt)) add(errors, label, 'tester.testedAt must be a real YYYY-MM-DD date');
  }

  const device = record.device;
  if (!isObject(device)) {
    add(errors, label, 'device is required');
  } else {
    if (device.physicalDevice !== true) add(errors, label, 'device.physicalDevice must be true; emulator evidence cannot satisfy #33');
    if (!nonEmptyString(device.manufacturer)) add(errors, label, 'device.manufacturer is required');
    if (!nonEmptyString(device.model)) add(errors, label, 'device.model is required');
    if (!nonEmptyString(device.androidVersion)) add(errors, label, 'device.androidVersion is required');
    if (!positiveInteger(device.apiLevel)) add(errors, label, 'device.apiLevel must be a positive integer');
    if (!isObject(device.screenPx) || !positiveNumber(device.screenPx.width) || !positiveNumber(device.screenPx.height)) {
      add(errors, label, 'device.screenPx.width/height must be positive numbers');
    }
    if (!positiveNumber(device.effectivePortraitCssWidth)) add(errors, label, 'device.effectivePortraitCssWidth must be a positive number');

    if (!Array.isArray(device.coverageRoles) || device.coverageRoles.length === 0) {
      add(errors, label, 'device.coverageRoles must contain at least one role');
    } else {
      const uniqueRoles = new Set(device.coverageRoles);
      if (uniqueRoles.size !== device.coverageRoles.length) add(errors, label, 'device.coverageRoles must not contain duplicates');
      for (const role of device.coverageRoles) {
        if (!ALLOWED_ROLES.has(role)) add(errors, label, `unknown device coverage role ${String(role)}`);
      }
      if (uniqueRoles.has('small_phone') && positiveNumber(device.effectivePortraitCssWidth)
        && (device.effectivePortraitCssWidth < 340 || device.effectivePortraitCssWidth > 420)) {
        add(errors, label, 'small_phone role requires an effective portrait CSS width in the 340–420 px acceptance band');
      }
      if (uniqueRoles.has('large_phone_or_tablet') && positiveNumber(device.effectivePortraitCssWidth)
        && device.effectivePortraitCssWidth <= 400) {
        add(errors, label, 'large_phone_or_tablet role requires effective portrait CSS width above 400 px');
      }
    }
  }

  const environment = record.environment;
  if (!isObject(environment)) {
    add(errors, label, 'environment is required');
  } else {
    for (const field of ['networkDisabledBeforeLaunch', 'reducedMotionOrAnimationsReduced', 'reducedMotionSettingSupported', 'rotationExercised', 'portraitExercised']) {
      if (typeof environment[field] !== 'boolean') add(errors, label, `environment.${field} must be boolean`);
    }
    if (environment.portraitExercised !== true) add(errors, label, 'portrait must be exercised on every final physical-device record');
  }

  const journeys = record.journeys;
  const journeyIds = new Set();
  if (!Array.isArray(journeys) || journeys.length === 0) {
    add(errors, label, 'journeys must contain at least one observed journey');
  } else {
    for (const journey of journeys) {
      if (!isObject(journey)) {
        add(errors, label, 'each journey must be an object');
        continue;
      }
      if (!REQUIRED_JOURNEYS.includes(journey.id)) {
        add(errors, label, `journey id must be one of ${REQUIRED_JOURNEYS.join(', ')}`);
        continue;
      }
      if (journeyIds.has(journey.id)) add(errors, label, `journey ${journey.id} is duplicated`);
      journeyIds.add(journey.id);
      if (!['pass', 'fail'].includes(journey.status)) add(errors, label, `journey ${journey.id} status must be pass or fail`);
      if (!Array.isArray(journey.observations) || journey.observations.length === 0 || journey.observations.some((item) => !nonEmptyString(item))) {
        add(errors, label, `journey ${journey.id} needs at least one non-placeholder observation`);
      }
    }
  }

  const roles = new Set(Array.isArray(device?.coverageRoles) ? device.coverageRoles : []);
  const passed = new Set(Array.isArray(journeys) ? journeys.filter((item) => item?.status === 'pass').map((item) => item.id) : []);
  if (passed.has('E')) {
    if (!roles.has('offline')) add(errors, label, 'a passing E journey requires the offline coverage role');
    if (environment?.networkDisabledBeforeLaunch !== true) add(errors, label, 'a passing E journey requires networkDisabledBeforeLaunch=true');
  }
  if (roles.has('offline') && environment?.networkDisabledBeforeLaunch !== true) {
    add(errors, label, 'offline coverage role requires networkDisabledBeforeLaunch=true');
  }
  if (passed.has('F') && environment?.reducedMotionSettingSupported === true && environment?.reducedMotionOrAnimationsReduced !== true) {
    add(errors, label, 'a passing F journey must exercise reduced motion/animation reduction when the device supports it');
  }
  if (passed.has('G') && environment?.rotationExercised !== true) {
    add(errors, label, 'a passing G journey requires rotationExercised=true');
  }

  const defects = record.defects;
  if (!Array.isArray(defects)) {
    add(errors, label, 'defects must be an array (empty is allowed)');
  } else {
    const defectIds = new Set();
    for (const defect of defects) {
      if (!isObject(defect)) {
        add(errors, label, 'each defect must be an object');
        continue;
      }
      if (!nonEmptyString(defect.id)) add(errors, label, 'each defect needs a stable id');
      else if (defectIds.has(defect.id)) add(errors, label, `defect id ${defect.id} is duplicated`);
      else defectIds.add(defect.id);
      if (!ALLOWED_SEVERITIES.has(defect.severity)) add(errors, label, `defect ${defect.id ?? '?'} has invalid severity`);
      if (!REQUIRED_JOURNEYS.includes(defect.journey)) add(errors, label, `defect ${defect.id ?? '?'} must reference journey A–G`);
      if (!ALLOWED_REPRODUCIBILITY.has(defect.reproducibility)) add(errors, label, `defect ${defect.id ?? '?'} has invalid reproducibility`);
      if (!['open', 'resolved'].includes(defect.status)) add(errors, label, `defect ${defect.id ?? '?'} status must be open or resolved`);
      if (!nonEmptyString(defect.expected) || !nonEmptyString(defect.actual)) add(errors, label, `defect ${defect.id ?? '?'} needs expected and actual observations`);
      if (!positiveInteger(defect.trackingIssue)) add(errors, label, `defect ${defect.id ?? '?'} must link a focused GitHub tracking issue number`);
      if (!Array.isArray(defect.evidenceRefs) || defect.evidenceRefs.length === 0 || defect.evidenceRefs.some((item) => !nonEmptyString(item))) {
        add(errors, label, `defect ${defect.id ?? '?'} needs at least one privacy-safe evidence reference`);
      }
      if (defect.status === 'open' && (defect.severity === 'blocker' || defect.severity === 'major')) {
        add(errors, label, `unresolved ${defect.severity} defect ${defect.id ?? '?'} blocks beta acceptance`);
      }
    }
  }

  const failedJourneys = Array.isArray(journeys) ? journeys.filter((item) => item?.status === 'fail').map((item) => item.id) : [];
  for (const journeyId of failedJourneys) {
    const linkedDefect = Array.isArray(defects) && defects.some((defect) => defect?.journey === journeyId);
    if (!linkedDefect) add(errors, label, `failed journey ${journeyId} must have a linked defect record`);
  }

  const attestation = record.attestation;
  if (!isObject(attestation)) {
    add(errors, label, 'attestation is required');
  } else {
    if (attestation.directPhysicalObservation !== true) add(errors, label, 'attestation.directPhysicalObservation must be true');
    if (!nonEmptyString(attestation.notes)) add(errors, label, 'attestation.notes is required');
  }

  return errors;
}

export function validateSuite(records) {
  const errors = [];
  if (!Array.isArray(records) || records.length === 0) return ['suite: no physical-device evidence records found'];

  for (const { record, label } of records) errors.push(...validateRecord(record, label));
  if (errors.length) return errors;

  const releaseKeys = new Set(records.map(({ record }) => [
    record.release.commitSha,
    record.release.apk.workflowRunId,
    record.release.apk.artifactId,
    record.release.apk.sha256
  ].join(':')));
  if (releaseKeys.size !== 1) errors.push('suite: all final device records must refer to the same exact APK/release identity');

  const roles = new Set(records.flatMap(({ record }) => record.device.coverageRoles));
  for (const role of REQUIRED_ROLES) {
    if (!roles.has(role)) errors.push(`suite: missing required device coverage role ${role}`);
  }

  const passingJourneys = new Set(records.flatMap(({ record }) => record.journeys.filter((item) => item.status === 'pass').map((item) => item.id)));
  for (const journey of REQUIRED_JOURNEYS) {
    if (!passingJourneys.has(journey)) errors.push(`suite: journey ${journey} has no passing physical-device observation`);
  }

  const offlineProof = records.some(({ record }) => record.device.coverageRoles.includes('offline')
    && record.environment.networkDisabledBeforeLaunch === true
    && record.journeys.some((item) => item.id === 'E' && item.status === 'pass'));
  if (!offlineProof) errors.push('suite: offline role must include a passing E journey with networking disabled before launch');

  const motionProof = records.some(({ record }) => record.journeys.some((item) => item.id === 'F' && item.status === 'pass')
    && (record.environment.reducedMotionOrAnimationsReduced === true || record.environment.reducedMotionSettingSupported === false));
  if (!motionProof) errors.push('suite: F requires a passing reduced-motion observation, or an explicit unsupported setting');

  const rotationProof = records.some(({ record }) => record.journeys.some((item) => item.id === 'G' && item.status === 'pass')
    && record.environment.rotationExercised === true);
  if (!rotationProof) errors.push('suite: G requires a passing record with physical rotation exercised');

  return errors;
}

function parseArgs(argv) {
  const options = { file: null, dir: null, requireCompleteSuite: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file') options.file = argv[++index];
    else if (arg.startsWith('--file=')) options.file = arg.slice('--file='.length);
    else if (arg === '--dir') options.dir = argv[++index];
    else if (arg.startsWith('--dir=')) options.dir = arg.slice('--dir='.length);
    else if (arg === '--require-complete-suite') options.requireCompleteSuite = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if ((options.file && options.dir) || (!options.file && !options.dir)) {
    throw new Error('Use exactly one of --file <path> or --dir <path>');
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

function main() {
  let options;
  let records;
  try {
    options = parseArgs(process.argv.slice(2));
    records = loadRecords(options);
  } catch (error) {
    console.error(`Android beta evidence validation failed: ${error.message}`);
    process.exit(1);
  }

  const errors = options.requireCompleteSuite
    ? validateSuite(records)
    : records.flatMap(({ record, label }) => validateRecord(record, label));

  if (errors.length) {
    console.error(`Android beta evidence validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  if (options.requireCompleteSuite) {
    console.log(`Android beta acceptance suite OK: ${records.length} physical-device record(s), roles ${REQUIRED_ROLES.join(', ')}, journeys A–G covered, no unresolved blocker/major defects.`);
  } else {
    console.log(`Android beta evidence OK: ${records.length} record(s).`);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-android-beta-evidence.mjs')) {
  main();
}
