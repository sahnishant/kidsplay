export interface DropSnapTarget {
  targetId: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface DropPoint {
  x: number;
  y: number;
}

function distanceToRect(point: DropPoint, target: DropSnapTarget): number {
  const dx = point.x < target.left
    ? target.left - point.x
    : point.x > target.right
      ? point.x - target.right
      : 0;
  const dy = point.y < target.top
    ? target.top - point.y
    : point.y > target.bottom
      ? point.y - target.bottom
      : 0;
  return Math.hypot(dx, dy);
}

/**
 * A direct DOM hit always wins. Otherwise a near miss may snap to the unique
 * nearest target within a small bounded tolerance. This changes motor demand,
 * not answer truth: the evaluator still owns whether the resulting assignment is correct.
 */
export function resolveForgivingDropTarget(
  point: DropPoint,
  directTargetId: string | undefined,
  targets: readonly DropSnapTarget[],
  tolerancePx = 24
): string | undefined {
  if (directTargetId) return directTargetId;
  if (!Number.isFinite(tolerancePx) || tolerancePx < 0) throw new Error('Drop snap tolerance must be non-negative');

  const candidates = targets
    .map((target) => ({ targetId: target.targetId, distance: distanceToRect(point, target) }))
    .filter((candidate) => candidate.distance <= tolerancePx)
    .sort((left, right) => left.distance - right.distance || left.targetId.localeCompare(right.targetId));

  if (!candidates.length) return undefined;
  return candidates[0].targetId;
}
