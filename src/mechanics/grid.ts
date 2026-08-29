export interface GridPoint {
  row: number;
  col: number;
}

export function pointKey(point: GridPoint): string {
  return `${point.row}:${point.col}`;
}

export function samePoint(left: GridPoint, right: GridPoint): boolean {
  return left.row === right.row && left.col === right.col;
}

export function lineBetween(start: GridPoint, end: GridPoint): GridPoint[] | null {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  const rowDistance = Math.abs(rowDelta);
  const colDistance = Math.abs(colDelta);

  const isStraight = rowDelta === 0 || colDelta === 0 || rowDistance === colDistance;
  if (!isStraight) return null;

  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const steps = Math.max(rowDistance, colDistance);

  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index
  }));
}
