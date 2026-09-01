import { spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const implementationPath = fileURLToPath(new URL('./compile-reviewed-batches-impl.mjs', import.meta.url));
const phaseCPath = fileURLToPath(new URL('./build-corpus-terminal-dispositions.mjs', import.meta.url));
const defaultLedgerPath = 'content/vocabulary-visuals/review-batches/ledger.json';
const lockDirectory = new URL('../../node_modules/.cache/kidsplay/', import.meta.url);
const lockPath = new URL('vocabulary-review-batch.lock', lockDirectory);
const lockWait = new Int32Array(new SharedArrayBuffer(4));
const LOCK_TIMEOUT_MS = 60_000;
const STALE_LOCK_MS = 120_000;

const fileTarget = (path) => isAbsolute(path) ? path : new URL(path, root);
const sleepSync = (milliseconds) => Atomics.wait(lockWait, 0, 0, milliseconds);
const normalizePath = (value) => String(value ?? '').replaceAll('\\', '/');

const generatedPaths = () => [
  ...readdirSync(new URL('content/vocabulary-visuals/', root))
    .filter((name) => name.startsWith('__generated-') && name.endsWith('.json'))
    .map((name) => `content/vocabulary-visuals/${name}`),
  ...readdirSync(new URL('content/vocabulary-visuals/batches/', root))
    .filter((name) => name.startsWith('__generated-') && name.endsWith('.json'))
    .map((name) => `content/vocabulary-visuals/batches/${name}`)
].sort();

const snapshotGeneratedState = () => new Map(
  generatedPaths().map((path) => [path, readFileSync(fileTarget(path))])
);

const clearGeneratedState = () => {
  for (const path of generatedPaths()) unlinkSync(fileTarget(path));
};

const restoreGeneratedState = (snapshot) => {
  clearGeneratedState();
  for (const [path, bytes] of snapshot) writeFileSync(fileTarget(path), bytes);
};

const acquireCompilerLock = () => {
  mkdirSync(lockDirectory, { recursive: true });
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  while (true) {
    try {
      const descriptor = openSync(lockPath, 'wx');
      writeFileSync(descriptor, JSON.stringify({ token, pid: process.pid, createdAt: Date.now() }));
      closeSync(descriptor);
      return () => {
        if (!existsSync(lockPath)) return;
        try {
          const current = JSON.parse(readFileSync(lockPath, 'utf8'));
          if (current?.token === token) unlinkSync(lockPath);
        } catch {
          // A malformed lock is not ours to remove unless the next acquisition deems it stale.
        }
      };
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      try {
        if (Date.now() - statSync(lockPath).mtimeMs > STALE_LOCK_MS) {
          unlinkSync(lockPath);
          continue;
        }
      } catch (inspectionError) {
        if (inspectionError?.code === 'ENOENT') continue;
        throw inspectionError;
      }
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for vocabulary review-batch compiler lock after ${LOCK_TIMEOUT_MS}ms`);
      }
      sleepSync(50);
    }
  }
};

const runChild = (scriptPath, args, label) => {
  const child = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (child.error) throw child.error;
  if (child.status !== 0) throw new Error(String(child.stderr || `${label} exited with status ${child.status}`));
};

const ledgerArg = process.argv.find((arg) => arg.startsWith('--ledger='));
const ledgerPath = ledgerArg?.slice('--ledger='.length) || defaultLedgerPath;
const isDefaultLedger = normalizePath(ledgerPath) === defaultLedgerPath;
const releaseLock = acquireCompilerLock();
const snapshot = snapshotGeneratedState();
let succeeded = false;

try {
  runChild(implementationPath, process.argv.slice(2), 'Vocabulary reviewed-batch implementation');
  if (isDefaultLedger) {
    runChild(phaseCPath, [], 'Vocabulary Phase C terminal accounting');
  }
  succeeded = true;
} finally {
  if (!isDefaultLedger || !succeeded) restoreGeneratedState(snapshot);
  releaseLock();
}
