import assetManifest from '../../content/assets/registry.json';

export interface BundledAssetDefinition {
  id: string;
  visualRefs: string[];
  sourceId: string;
  sourceRevision: string;
  sourcePathOrName: string;
  sourceBlobSha: string;
  localPath: string;
  license: string;
  attributionRequired: boolean;
  modificationStatus: string;
}

export interface ResolvedBundledAsset extends BundledAssetDefinition {
  url: string;
}

const definitions = (assetManifest.assets as BundledAssetDefinition[]).map((definition) => ({
  ...definition,
  visualRefs: [...definition.visualRefs]
}));
const assetById = new Map(definitions.map((definition) => [definition.id, definition]));
const assetRefByVisualRef = new Map<string, string>();
const bundledPathPrefix = assetManifest.policy.bundledPathPrefix;

for (const definition of definitions) {
  for (const visualRef of definition.visualRefs) {
    if (!assetRefByVisualRef.has(visualRef)) assetRefByVisualRef.set(visualRef, definition.id);
  }
}

function toPublicUrl(localPath: string): string | null {
  if (
    !localPath.startsWith(bundledPathPrefix) ||
    !localPath.startsWith('public/') ||
    localPath.includes('..') ||
    localPath.includes('\\')
  ) {
    return null;
  }
  const relativePath = localPath.slice('public/'.length);
  return relativePath ? `/${relativePath}` : null;
}

export function resolveAssetRefForVisualRef(visualRef: string): string | undefined {
  return assetRefByVisualRef.get(visualRef);
}

export function resolveBundledAsset(assetRef?: string): ResolvedBundledAsset | null {
  if (!assetRef) return null;
  const definition = assetById.get(assetRef);
  if (!definition) return null;
  const url = toPublicUrl(definition.localPath);
  return url ? { ...definition, visualRefs: [...definition.visualRefs], url } : null;
}

export function getBundledAssetDefinitions(): BundledAssetDefinition[] {
  return definitions.map((definition) => ({ ...definition, visualRefs: [...definition.visualRefs] }));
}
