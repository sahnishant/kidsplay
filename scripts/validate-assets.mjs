import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRootDir = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const gitTextExtensions = new Set(['.svg']);

export function gitBlobSha(buffer) {
  return createHash('sha1')
    .update(`blob ${buffer.length}\0`)
    .update(buffer)
    .digest('hex');
}

/**
 * Git may materialize text files with CRLF on Windows even though the stored
 * repository blob is LF-only. Provenance is pinned to the upstream Git blob,
 * so compare the Git-clean form for known text artwork while leaving binary
 * assets byte-exact.
 */
export function sourceBlobSha(buffer, repoPath) {
  const extension = path.posix.extname(repoPath).toLowerCase();
  if (!gitTextExtensions.has(extension)) return gitBlobSha(buffer);
  const normalized = Buffer.from(buffer.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
  return gitBlobSha(normalized);
}

function isSafeRepoPath(value, prefix) {
  if (typeof value !== 'string' || !value || value.includes('\\') || path.posix.isAbsolute(value)) {
    return false;
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized === '..' || normalized.startsWith('../')) return false;
  return !prefix || value.startsWith(prefix);
}

function absoluteRepoPath(rootDir, repoPath) {
  return path.resolve(rootDir, ...repoPath.split('/'));
}

function collectBundledFiles(directory, rootDir, errors) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      errors.push(`bundled asset tree contains unsupported symlink: ${path.relative(rootDir, absolutePath)}`);
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...collectBundledFiles(absolutePath, rootDir, errors));
    } else if (entry.isFile()) {
      files.push(path.relative(rootDir, absolutePath).split(path.sep).join('/'));
    }
  }
  return files;
}

function loadRegistry(registryPath) {
  return JSON.parse(readFileSync(registryPath, 'utf8'));
}

export function validateAssetRegistry(options = {}) {
  const rootDir = path.resolve(options.rootDir ?? defaultRootDir);
  const registryPath = path.resolve(options.registryPath ?? path.join(rootDir, 'content', 'assets', 'registry.json'));
  const registry = options.registry ?? loadRegistry(registryPath);
  const errors = [];

  if (registry?.schemaVersion !== 1) errors.push('unsupported asset registry schema version');
  if (!Array.isArray(registry?.sources)) errors.push('asset registry must contain sources[]');
  if (!Array.isArray(registry?.assets)) errors.push('asset registry must contain assets[]');
  if (errors.length) return { errors, assetCount: 0, sourceCount: 0 };

  const allowedSourceStatuses = new Set(registry.policy?.allowedSourceStatuses ?? []);
  const requiredFields = registry.policy?.requiredForBundledAsset ?? [];
  const bundledPathPrefix = registry.policy?.bundledPathPrefix;
  if (typeof bundledPathPrefix !== 'string' || !bundledPathPrefix.endsWith('/')) {
    errors.push('policy.bundledPathPrefix must be a trailing-slash repository path');
  } else if (!isSafeRepoPath(bundledPathPrefix)) {
    errors.push(`unsafe policy.bundledPathPrefix: ${bundledPathPrefix}`);
  }

  const sourceById = new Map();
  for (const source of registry.sources) {
    if (!source?.id || typeof source.id !== 'string') {
      errors.push('asset source is missing a string id');
      continue;
    }
    if (sourceById.has(source.id)) errors.push(`duplicate asset source id: ${source.id}`);
    sourceById.set(source.id, source);
  }

  const seenAssetIds = new Set();
  const seenLocalPaths = new Set();
  const visualOwner = new Map();
  const allowedBundledFiles = new Set();
  const usedSourceIds = new Set();

  for (const source of registry.sources) {
    if (!source?.licenseFile) continue;
    if (!isSafeRepoPath(source.licenseFile, bundledPathPrefix)) {
      errors.push(`${source.id}: unsafe licenseFile ${source.licenseFile}`);
      continue;
    }
    allowedBundledFiles.add(source.licenseFile);
    const licensePath = absoluteRepoPath(rootDir, source.licenseFile);
    if (!existsSync(licensePath) || !statSync(licensePath).isFile()) {
      errors.push(`${source.id}: missing redistribution license file ${source.licenseFile}`);
    }
  }

  for (const asset of registry.assets) {
    if (!asset?.id || typeof asset.id !== 'string') {
      errors.push('bundled asset is missing a string id');
      continue;
    }
    if (seenAssetIds.has(asset.id)) errors.push(`duplicate bundled asset id: ${asset.id}`);
    seenAssetIds.add(asset.id);

    for (const field of requiredFields) {
      if (asset[field] === undefined || asset[field] === null || asset[field] === '') {
        errors.push(`${asset.id}: required asset field ${field} is missing`);
      }
    }

    if (!Array.isArray(asset.visualRefs) || asset.visualRefs.length === 0) {
      errors.push(`${asset.id}: visualRefs must contain at least one semantic visual id`);
    } else {
      for (const visualRef of asset.visualRefs) {
        if (typeof visualRef !== 'string' || !visualRef.trim()) {
          errors.push(`${asset.id}: visualRefs contains an invalid value`);
          continue;
        }
        const owner = visualOwner.get(visualRef);
        if (owner && owner !== asset.id) {
          errors.push(`${asset.id}: visualRef ${visualRef} is already owned by ${owner}`);
        } else {
          visualOwner.set(visualRef, asset.id);
        }
      }
    }

    if (!isSafeRepoPath(asset.sourcePathOrName)) {
      errors.push(`${asset.id}: unsafe sourcePathOrName ${asset.sourcePathOrName}`);
    }

    const source = sourceById.get(asset.sourceId);
    if (!source) {
      errors.push(`${asset.id}: unknown asset source ${asset.sourceId}`);
    } else {
      usedSourceIds.add(source.id);
      if (!allowedSourceStatuses.has(source.status)) {
        errors.push(`${asset.id}: source ${source.id} is not approved for bundling`);
      }
      if (typeof source.revision !== 'string' || !source.revision.trim()) {
        errors.push(`${asset.id}: source ${source.id} has no immutable revision`);
      } else {
        if (asset.sourceRevision !== source.revision) {
          errors.push(`${asset.id}: source revision does not match pinned source ${source.revision}`);
        }
        if (
          String(source.repository ?? '').startsWith('https://github.com/') &&
          !/^[0-9a-f]{40}$/.test(source.revision)
        ) {
          errors.push(`${asset.id}: GitHub source ${source.id} must be pinned to a full commit SHA`);
        }
      }
      if (source.license && asset.license !== source.license) {
        errors.push(`${asset.id}: asset license ${asset.license} does not match source license ${source.license}`);
      }
      if ((source.attributionRequired || asset.attributionRequired) && !String(asset.attributionText ?? '').trim()) {
        errors.push(`${asset.id}: attribution text is required`);
      }
      if (source.redistributionNoticeRequired && !source.licenseFile) {
        errors.push(`${asset.id}: source ${source.id} requires a redistributed license file`);
      }
    }

    if (!/^[0-9a-f]{40}$/.test(String(asset.sourceBlobSha ?? ''))) {
      errors.push(`${asset.id}: sourceBlobSha must be an exact 40-character Git blob SHA`);
    }
    if (asset.modificationStatus !== 'unmodified') {
      errors.push(`${asset.id}: modified third-party assets are blocked until a content-hash policy is registered`);
    }

    if (!isSafeRepoPath(asset.localPath, bundledPathPrefix)) {
      errors.push(`${asset.id}: unsafe or out-of-scope localPath ${asset.localPath}`);
      continue;
    }
    if (seenLocalPaths.has(asset.localPath)) errors.push(`${asset.id}: duplicate localPath ${asset.localPath}`);
    seenLocalPaths.add(asset.localPath);
    allowedBundledFiles.add(asset.localPath);

    const absolutePath = absoluteRepoPath(rootDir, asset.localPath);
    const bundledRoot = bundledPathPrefix
      ? absoluteRepoPath(rootDir, bundledPathPrefix)
      : rootDir;
    if (absolutePath !== bundledRoot && !absolutePath.startsWith(`${bundledRoot}${path.sep}`)) {
      errors.push(`${asset.id}: localPath escapes bundled asset root`);
      continue;
    }
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      errors.push(`${asset.id}: registered asset file is missing: ${asset.localPath}`);
      continue;
    }

    const bytes = readFileSync(absolutePath);
    const actualBlobSha = sourceBlobSha(bytes, asset.localPath);
    if (actualBlobSha !== asset.sourceBlobSha) {
      errors.push(`${asset.id}: provenance hash mismatch for ${asset.localPath}; expected ${asset.sourceBlobSha}, got ${actualBlobSha}`);
    }
  }

  if (bundledPathPrefix && isSafeRepoPath(bundledPathPrefix)) {
    const bundledRoot = absoluteRepoPath(rootDir, bundledPathPrefix);
    for (const repoPath of collectBundledFiles(bundledRoot, rootDir, errors)) {
      if (!allowedBundledFiles.has(repoPath)) {
        errors.push(`unregistered file in bundled asset tree: ${repoPath}`);
      }
    }
  }

  return {
    errors,
    assetCount: registry.assets.length,
    sourceCount: usedSourceIds.size
  };
}

function parseCliOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('--root requires a directory');
      options.rootDir = value;
      index += 1;
    } else if (argument === '--registry') {
      const value = argv[index + 1];
      if (!value) throw new Error('--registry requires a JSON file path');
      options.registryPath = value;
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function runCli() {
  let options;
  try {
    options = parseCliOptions(process.argv.slice(2));
  } catch (error) {
    console.error(`Asset validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  const result = validateAssetRegistry(options);
  if (result.errors.length) {
    console.error(`Asset validation failed with ${result.errors.length} error(s):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${result.assetCount} bundled open asset(s) from ${result.sourceCount} source(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
