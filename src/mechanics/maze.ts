export const WALL_TOP = 1;
export const WALL_RIGHT = 2;
export const WALL_BOTTOM = 4;
export const WALL_LEFT = 8;

export function canTravel(
  wallMasks: readonly number[],
  rows: number,
  cols: number,
  fromIndex: number,
  toIndex: number
): boolean {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= wallMasks.length || toIndex >= wallMasks.length) return false;

  const fromRow = Math.floor(fromIndex / cols);
  const fromCol = fromIndex % cols;
  const toRow = Math.floor(toIndex / cols);
  const toCol = toIndex % cols;
  if (fromRow >= rows || toRow >= rows) return false;

  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  if (Math.abs(dr) + Math.abs(dc) !== 1) return false;

  if (dr === -1) return !(wallMasks[fromIndex] & WALL_TOP) && !(wallMasks[toIndex] & WALL_BOTTOM);
  if (dr === 1) return !(wallMasks[fromIndex] & WALL_BOTTOM) && !(wallMasks[toIndex] & WALL_TOP);
  if (dc === -1) return !(wallMasks[fromIndex] & WALL_LEFT) && !(wallMasks[toIndex] & WALL_RIGHT);
  return !(wallMasks[fromIndex] & WALL_RIGHT) && !(wallMasks[toIndex] & WALL_LEFT);
}
