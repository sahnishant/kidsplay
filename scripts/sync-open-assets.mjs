import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitBlobSha, validateAssetRegistry } from './validate-assets.mjs';

const rootDir = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const registryPath = path.join(rootDir, 'content', 'assets', 'registry.json');

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        if (redirects >= 3) return reject(new Error(`Too many redirects while fetching ${url}`));
        return resolve(download(new URL(response.headers.location, url), redirects + 1));
      }
      if (response.statusCode !== 200) {
        response.resume();
        return reject(new Error(`HTTP ${response.statusCode ?? 'unknown'} while fetching ${url}`));
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

function githubRawUrl(source, asset) {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/.exec(String(source.repository ?? ''));
  if (!match) throw new Error(`${asset.id}: sync currently supports pinned GitHub sources only`);
  const [, owner, repository] = match;
  const encodedPath = asset.sourcePathOrName.split('/').map(encodeURIComponent).join('/');
  return new URL(`https://raw.githubusercontent.com/${owner}/${repository}/${asset.sourceRevision}/${encodedPath}`);
}

function destinationPath(localPath) {
  if (!localPath.startsWith('public/assets/open/') || localPath.includes('..') || localPath.includes('\\')) {
    throw new Error(`Unsafe open-asset destination: ${localPath}`);
  }
  return path.resolve(rootDir, ...localPath.split('/'));
}

async function main() {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  const sourceById = new Map(registry.sources.map((source) => [source.id, source]));
  const assetById = new Map(registry.assets.map((asset) => [asset.id, asset]));
  const requestedIds = process.argv.slice(2);
  const assets = requestedIds.length
    ? requestedIds.map((id) => {
        const asset = assetById.get(id);
        if (!asset) throw new Error(`Unknown registered asset id: ${id}`);
        return asset;
      })
    : registry.assets;

  for (const asset of assets) {
    const source = sourceById.get(asset.sourceId);
    if (!source || source.status !== 'approved') throw new Error(`${asset.id}: source is not approved`);
    if (!/^[0-9a-f]{40}$/.test(asset.sourceRevision) || asset.sourceRevision !== source.revision) {
      throw new Error(`${asset.id}: source revision must match the pinned GitHub commit`);
    }
    if (asset.modificationStatus !== 'unmodified') {
      throw new Error(`${asset.id}: sync refuses modified third-party assets`);
    }

    const url = githubRawUrl(source, asset);
    const bytes = await download(url);
    const actualBlobSha = gitBlobSha(bytes);
    if (actualBlobSha !== asset.sourceBlobSha) {
      throw new Error(`${asset.id}: upstream blob hash mismatch; expected ${asset.sourceBlobSha}, got ${actualBlobSha}`);
    }

    const target = destinationPath(asset.localPath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, bytes);
    console.log(`Synced ${asset.id} -> ${asset.localPath}`);
  }

  const validation = validateAssetRegistry();
  if (validation.errors.length) {
    throw new Error(`Post-sync validation failed:\n${validation.errors.map((error) => `- ${error}`).join('\n')}`);
  }
  console.log(`Asset sync complete; ${validation.assetCount} bundled asset(s) validated offline.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
