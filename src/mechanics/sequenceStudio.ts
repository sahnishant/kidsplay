import type { SequenceItem } from '../contracts/question';

/** Restore only a complete permutation of this activity's IDs. Never infer an answer from a saved state. */
export function restoreSequenceOrder<T extends SequenceItem>(items: T[], state: unknown): T[] | null {
  if (!state || typeof state !== 'object' || !('orderedItemIds' in state)) return null;
  const ids: unknown = state.orderedItemIds;
  if (!Array.isArray(ids) || ids.length !== items.length || new Set(ids).size !== items.length) return null;
  const byId = new Map(items.map((item) => [item.id, item]));
  if (ids.some((id) => typeof id !== 'string' || !byId.has(id))) return null;
  return ids.map((id) => byId.get(id)!).map((item) => ({ ...item }));
}
