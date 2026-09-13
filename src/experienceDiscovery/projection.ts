export type ExperienceDiscoveryKind =
  | 'catalog_entry'
  | 'learn_about_topic'
  | 'learning_studio'
  | 'guided_workshop'
  | 'phonics_adventure'
  | 'story'
  | 'story_mission'
  | 'world_action';

export type ExperienceDiscoveryAvailability = 'available' | 'partial' | 'unavailable';

export type ExperienceDiscoveryResume = 'none' | 'workspace' | 'exact' | 'completion_only';

export type ExperienceDiscoveryProgressOwner =
  | 'none'
  | 'mastery_evidence'
  | 'studio_workspace'
  | 'story_reading'
  | 'story_progress';

export type ExperienceDiscoverySurface =
  | 'catalog'
  | 'home_direct'
  | 'learn_about'
  | 'topic_section'
  | 'workshop_section'
  | 'story_library'
  | 'story_world';

export interface ExperienceLaunchReference {
  /** Existing runtime owner. Discovery never evaluates or scores an activity. */
  owner:
    | 'catalog'
    | 'learn_about'
    | 'learning_studio'
    | 'bicycle_workshop'
    | 'phonics'
    | 'stories'
    | 'story_world';
  /** Canonical ref understood by the existing owner. */
  ref: string;
  /** Existing launch mode only; discovery must not invent a universal mode ladder. */
  mode?: string;
}

export interface ExperienceDiscoveryEntryPoint {
  /** Existing source surface/context. This is navigation metadata, not achievement identity. */
  surface: ExperienceDiscoverySurface;
  ownerRef?: string;
  sectionRef?: string;
}

export interface ExperienceDiscoveryProgressProjection {
  owner: ExperienceDiscoveryProgressOwner;
  resume: ExperienceDiscoveryResume;
}

export interface ExperienceDiscoveryRecord {
  /** Stable existing activity/experience identity. */
  canonicalId: string;
  kind: ExperienceDiscoveryKind;
  childTitle: string;
  launch: ExperienceLaunchReference;
  entryPoint: ExperienceDiscoveryEntryPoint;
  sourceRefs: readonly string[];
  presentationRefs?: readonly string[];
  profileRefs?: readonly string[];
  availability: ExperienceDiscoveryAvailability;
  progress: ExperienceDiscoveryProgressProjection;
}

export interface ExperienceDiscoveryDescriptor {
  canonicalId: string;
  kind: ExperienceDiscoveryKind;
  childTitle: string;
  launch: ExperienceLaunchReference;
  entryPoints: ExperienceDiscoveryEntryPoint[];
  sourceRefs: string[];
  presentationRefs: string[];
  profileRefs: string[];
  availability: ExperienceDiscoveryAvailability;
  progress: ExperienceDiscoveryProgressProjection;
}

export interface ExperienceDiscoveryFilter {
  canonicalIds?: readonly string[];
  kinds?: readonly ExperienceDiscoveryKind[];
  availability?: readonly ExperienceDiscoveryAvailability[];
  profileRef?: string;
}

export type ExperienceDiscoveryReferenceState =
  | { status: 'found'; descriptor: ExperienceDiscoveryDescriptor }
  | { status: 'stale'; canonicalId: string };

const STABLE_REF = /^[a-zA-Z0-9][a-zA-Z0-9._:@/-]{0,199}$/;

function uniqueSorted(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function entryPointKey(entryPoint: ExperienceDiscoveryEntryPoint): string {
  return [entryPoint.surface, entryPoint.ownerRef ?? '', entryPoint.sectionRef ?? ''].join('|');
}

function cloneEntryPoint(entryPoint: ExperienceDiscoveryEntryPoint): ExperienceDiscoveryEntryPoint {
  return {
    surface: entryPoint.surface,
    ...(entryPoint.ownerRef ? { ownerRef: entryPoint.ownerRef } : {}),
    ...(entryPoint.sectionRef ? { sectionRef: entryPoint.sectionRef } : {})
  };
}

function cloneLaunch(launch: ExperienceLaunchReference): ExperienceLaunchReference {
  return {
    owner: launch.owner,
    ref: launch.ref,
    ...(launch.mode ? { mode: launch.mode } : {})
  };
}

function cloneProgress(progress: ExperienceDiscoveryProgressProjection): ExperienceDiscoveryProgressProjection {
  return { owner: progress.owner, resume: progress.resume };
}

function assertRecord(record: ExperienceDiscoveryRecord): void {
  if (!STABLE_REF.test(record.canonicalId)) throw new Error(`Invalid discovery canonicalId ${record.canonicalId}`);
  if (!record.childTitle.trim()) throw new Error(`${record.canonicalId}: childTitle is required`);
  if (!STABLE_REF.test(record.launch.ref)) throw new Error(`${record.canonicalId}: invalid launch ref ${record.launch.ref}`);
  if (record.entryPoint.ownerRef && !STABLE_REF.test(record.entryPoint.ownerRef)) {
    throw new Error(`${record.canonicalId}: invalid entry owner ref ${record.entryPoint.ownerRef}`);
  }
  if (record.entryPoint.sectionRef && !STABLE_REF.test(record.entryPoint.sectionRef)) {
    throw new Error(`${record.canonicalId}: invalid entry section ref ${record.entryPoint.sectionRef}`);
  }
}

function sameCore(left: ExperienceDiscoveryDescriptor, right: ExperienceDiscoveryRecord): boolean {
  return left.kind === right.kind
    && left.childTitle === right.childTitle.trim()
    && left.launch.owner === right.launch.owner
    && left.launch.ref === right.launch.ref
    && left.launch.mode === right.launch.mode
    && left.availability === right.availability
    && left.progress.owner === right.progress.owner
    && left.progress.resume === right.progress.resume
    && JSON.stringify(left.presentationRefs) === JSON.stringify(uniqueSorted(right.presentationRefs))
    && JSON.stringify(left.profileRefs) === JSON.stringify(uniqueSorted(right.profileRefs));
}

/**
 * Collapses multiple navigation placements onto one canonical experience identity.
 * It is intentionally read-only: no recommendation, scoring, unlock or persistence
 * decisions are made here.
 */
export function buildExperienceDiscovery(
  records: readonly ExperienceDiscoveryRecord[]
): ExperienceDiscoveryDescriptor[] {
  const byId = new Map<string, ExperienceDiscoveryDescriptor>();

  for (const record of records) {
    assertRecord(record);
    const existing = byId.get(record.canonicalId);
    if (!existing) {
      byId.set(record.canonicalId, {
        canonicalId: record.canonicalId,
        kind: record.kind,
        childTitle: record.childTitle.trim(),
        launch: cloneLaunch(record.launch),
        entryPoints: [cloneEntryPoint(record.entryPoint)],
        sourceRefs: uniqueSorted(record.sourceRefs),
        presentationRefs: uniqueSorted(record.presentationRefs),
        profileRefs: uniqueSorted(record.profileRefs),
        availability: record.availability,
        progress: cloneProgress(record.progress)
      });
      continue;
    }

    if (!sameCore(existing, record)) {
      throw new Error(`${record.canonicalId}: conflicting discovery metadata for one canonical identity`);
    }

    existing.sourceRefs = uniqueSorted([...existing.sourceRefs, ...record.sourceRefs]);
    const points = new Map(existing.entryPoints.map((point) => [entryPointKey(point), point]));
    points.set(entryPointKey(record.entryPoint), cloneEntryPoint(record.entryPoint));
    existing.entryPoints = [...points.values()].sort((left, right) =>
      entryPointKey(left).localeCompare(entryPointKey(right))
    );
  }

  return [...byId.values()]
    .map((descriptor) => ({
      ...descriptor,
      launch: cloneLaunch(descriptor.launch),
      progress: cloneProgress(descriptor.progress),
      entryPoints: descriptor.entryPoints.map(cloneEntryPoint),
      sourceRefs: [...descriptor.sourceRefs],
      presentationRefs: [...descriptor.presentationRefs],
      profileRefs: [...descriptor.profileRefs]
    }))
    .sort((left, right) => left.canonicalId.localeCompare(right.canonicalId));
}

export function filterExperienceDiscovery(
  descriptors: readonly ExperienceDiscoveryDescriptor[],
  filter: ExperienceDiscoveryFilter
): ExperienceDiscoveryDescriptor[] {
  const canonicalIds = filter.canonicalIds ? new Set(filter.canonicalIds) : null;
  const kinds = filter.kinds ? new Set(filter.kinds) : null;
  const availability = filter.availability ? new Set(filter.availability) : null;

  return descriptors.filter((descriptor) => {
    if (canonicalIds && !canonicalIds.has(descriptor.canonicalId)) return false;
    if (kinds && !kinds.has(descriptor.kind)) return false;
    if (availability && !availability.has(descriptor.availability)) return false;
    if (filter.profileRef && !descriptor.profileRefs.includes(filter.profileRef)) return false;
    return true;
  });
}

export function resolveExperienceDiscoveryReference(
  descriptors: readonly ExperienceDiscoveryDescriptor[],
  canonicalId: string
): ExperienceDiscoveryReferenceState {
  const descriptor = descriptors.find((item) => item.canonicalId === canonicalId);
  return descriptor ? { status: 'found', descriptor } : { status: 'stale', canonicalId };
}
