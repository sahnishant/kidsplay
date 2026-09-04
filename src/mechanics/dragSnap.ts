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

const AMBIGUITY_MARGIN_PX = 1;

function validateTarget(target: DropSnapTarget): DropSnapTarget {
  if (!target.targetId.trim()) throw new Error('Drop snap targetId must be non-empty');
  const coordinates = [target.left, target.top, target.right, target.bottom];
  if (coordinates.some((value) => !Number.isFinite(value))) {
    throw new Error(`${target.targetId}: drop snap bounds must be finite`);
  }
  if (target.right < target.left || target.bottom < target.top) {
    throw new Error(`${target.targetId}: drop snap bounds are invalid`);
  }
  return target;
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
 * A direct in-scope DOM hit always wins. Otherwise a near miss may snap only
 * to a uniquely nearest target within a small bounded tolerance. Ambiguous
 * midpoint drops remain misses rather than becoming arbitrary answers. This
 * changes motor demand, not answer truth: the evaluator still owns whether the
 * resulting assignment is correct.
 */
export function resolveForgivingDropTarget(
  point: DropPoint,
  directTargetId: string | undefined,
  targets: readonly DropSnapTarget[],
  tolerancePx = 24
): string | undefined {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error('Drop point must be finite');
  if (!Number.isFinite(tolerancePx) || tolerancePx < 0) throw new Error('Drop snap tolerance must be non-negative');

  const validatedTargets = targets.map(validateTarget);
  const targetIds = validatedTargets.map((target) => target.targetId);
  if (new Set(targetIds).size !== targetIds.length) throw new Error('Drop snap target ids must be unique');

  if (directTargetId) {
    return validatedTargets.some((target) => target.targetId === directTargetId)
      ? directTargetId
      : undefined;
  }

  const candidates = validatedTargets
    .map((target) => ({ targetId: target.targetId, distance: distanceToRect(point, target) }))
    .filter((candidate) => candidate.distance <= tolerancePx)
    .sort((left, right) => left.distance - right.distance || left.targetId.localeCompare(right.targetId));

  if (!candidates.length) return undefined;
  if (candidates.length > 1 && candidates[1].distance - candidates[0].distance < AMBIGUITY_MARGIN_PX) {
    return undefined;
  }
  return candidates[0].targetId;
}
