/** Runtime-owned local work cache, separate from assessment/progress records.
 * One key per owner/activity avoids overwriting another activity's work.
 * Compare-before-write detects sequential stale writers, not atomic multi-tab CAS.
 */
export const STUDIO_WORK_PREFIX = 'kidsplay.studioWork.v1:';
const MAX_BYTES = 48000;
const MAX_RECORDS = 64;
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const identifier = (value) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:@/-]{0,159}$/.test(value);

export function studioWorkKey(ownerId, activityId) {
  if (!identifier(ownerId) || !identifier(activityId) || !activityId.startsWith('studio.')) throw new Error('Stable owner and activity IDs are required');
  return `${STUDIO_WORK_PREFIX}${encodeURIComponent(ownerId)}:${encodeURIComponent(activityId)}`;
}
export function browserStudioStorage() {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

export function createStudioWorkStore(ownerId, storageProvider = browserStudioStorage) {
  studioWorkKey(ownerId, 'studio.identity');
  function load(activityId) {
    const key = studioWorkKey(ownerId, activityId);
    try {
      const storage = storageProvider();
      if (!storage) return { status: 'unavailable', token: null, workspace: null };
      const raw = storage.getItem(key);
      if (raw === null) return { status: 'empty', token: null, workspace: null };
      if (raw.length * 2 > MAX_BYTES) return { status: 'corrupt', token: raw, workspace: null };
      let value;
      try { value = JSON.parse(raw); }
      catch { return { status: 'corrupt', token: raw, workspace: null }; }
      if (!record(value) || value.version !== 1 || value.ownerId !== ownerId || value.activityId !== activityId
        || !Number.isSafeInteger(value.generation) || value.generation < 1
        || !Object.hasOwn(value, 'workspace') || (value.workspace !== null && !record(value.workspace))) {
        return { status: 'corrupt', token: raw, workspace: null };
      }
      return { status: value.workspace === null ? 'empty' : 'ready', token: raw, workspace: value.workspace };
    } catch { return { status: 'unavailable', token: null, workspace: null }; }
  }
  function save(activityId, workspace, expectedToken) {
    const key = studioWorkKey(ownerId, activityId);
    if (workspace !== null && (!record(workspace) || workspace.activityId !== activityId || workspace.schemaVersion !== 2)) return { status: 'invalid', token: expectedToken };
    const current = load(activityId);
    if (['unavailable', 'corrupt'].includes(current.status)) return { status: current.status, token: expectedToken };
    if (current.token !== expectedToken) return { status: 'conflict', token: expectedToken };
    try {
      if (JSON.stringify(current.workspace) === JSON.stringify(workspace)) return { status: 'unchanged', token: current.token };
      const storage = storageProvider();
      if (!storage) return { status: 'unavailable', token: expectedToken };
      // Bound all owners together; never silently evict a child's unfinished work.
      if (current.token === null) {
        let count = 0;
        for (let i = 0; i < storage.length; i += 1) if (storage.key(i)?.startsWith(STUDIO_WORK_PREFIX)) count += 1;
        if (count >= MAX_RECORDS) return { status: 'full', token: expectedToken };
      }
      const generation = current.token === null ? 1 : JSON.parse(current.token).generation + 1;
      if (!Number.isSafeInteger(generation)) return { status: 'full', token: expectedToken };
      const raw = JSON.stringify({ version: 1, ownerId, activityId, generation, workspace });
      if (raw.length * 2 > MAX_BYTES) return { status: 'full', token: expectedToken };
      storage.setItem(key, raw);
      return { status: 'saved', token: raw };
    } catch { return { status: 'unavailable', token: expectedToken }; }
  }
  return { load, save, clear: (activityId, token) => save(activityId, null, token) };
}
