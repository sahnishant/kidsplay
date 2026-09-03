import type { NormalizedPoint, TracePathQuestion } from '../contracts/question';

interface TraceStroke { points?: unknown; }
interface TraceResponse { strokes?: unknown; }

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function isNormalizedPoint(value: unknown): value is NormalizedPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as Record<string, unknown>;
  return typeof point.x === 'number'
    && Number.isFinite(point.x)
    && point.x >= 0
    && point.x <= 1
    && typeof point.y === 'number'
    && Number.isFinite(point.y)
    && point.y >= 0
    && point.y <= 1;
}

export function normalizeClientPoint(
  clientX: number,
  clientY: number,
  bounds: { left: number; top: number; width: number; height: number }
): NormalizedPoint {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 };
  return {
    x: clamp01((clientX - bounds.left) / bounds.width),
    y: clamp01((clientY - bounds.top) / bounds.height)
  };
}

export function pointDistance(left: NormalizedPoint, right: NormalizedPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function pointToSegmentDistance(point: NormalizedPoint, start: NormalizedPoint, end: NormalizedPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= Number.EPSILON) return pointDistance(point, start);
  const projection = clamp01(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared);
  return pointDistance(point, { x: start.x + projection * dx, y: start.y + projection * dy });
}

export function pointToPolylineDistance(point: NormalizedPoint, path: readonly NormalizedPoint[]): number {
  if (!path.length) return Number.POSITIVE_INFINITY;
  if (path.length === 1) return pointDistance(point, path[0]);
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 1; index < path.length; index += 1) {
    minimum = Math.min(minimum, pointToSegmentDistance(point, path[index - 1], path[index]));
  }
  return minimum;
}

export function primaryTracePoints(response: unknown): NormalizedPoint[] {
  const payload = response as TraceResponse | null | undefined;
  if (!Array.isArray(payload?.strokes)) return [];
  const strokes = payload.strokes
    .map((candidate) => {
      const stroke = candidate as TraceStroke | null | undefined;
      return Array.isArray(stroke?.points) ? stroke.points.filter(isNormalizedPoint) : [];
    })
    .filter((points) => points.length > 0)
    .sort((left, right) => right.length - left.length);
  return strokes[0] ?? [];
}

export function traceCorridorScore(question: TracePathQuestion, response: unknown): number {
  const points = primaryTracePoints(response);
  const guide = question.interaction.board.guidePath.filter(isNormalizedPoint);
  const solution = question.solution;
  if (guide.length < 2 || points.length === 0) return 0;

  const first = points[0];
  const last = points[points.length - 1];
  const inCorridor = points.filter(
    (point) => pointToPolylineDistance(point, guide) <= solution.corridorRadius
  ).length / points.length;
  const guideCoverage = guide.filter((guidePoint) =>
    points.some((point) => pointDistance(point, guidePoint) <= solution.corridorRadius * 1.5)
  ).length / guide.length;

  const criteria = [
    points.length >= solution.minPointCount,
    pointDistance(first, question.interaction.board.start.point) <= solution.startRadius,
    pointDistance(last, question.interaction.board.goal.point) <= solution.goalRadius,
    inCorridor >= solution.minInCorridorRatio,
    guideCoverage >= solution.minGuideCoverage
  ];
  return criteria.filter(Boolean).length / criteria.length;
}
