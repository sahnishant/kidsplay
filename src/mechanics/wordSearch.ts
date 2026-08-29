import type { WordSearchDirection, WordSearchTerm } from '../contracts/question';
import type { GridPoint } from './grid';
import { createSeededRandom, shuffled } from './random';

const DIRECTION_STEPS: Record<WordSearchDirection, GridPoint> = {
  right: { row: 0, col: 1 },
  left: { row: 0, col: -1 },
  down: { row: 1, col: 0 },
  up: { row: -1, col: 0 },
  down_right: { row: 1, col: 1 },
  down_left: { row: 1, col: -1 },
  up_right: { row: -1, col: 1 },
  up_left: { row: -1, col: -1 }
};

export const DEFAULT_WORD_SEARCH_DIRECTIONS: WordSearchDirection[] = ['right', 'down', 'down_right'];

export interface WordSearchPlacement {
  termId: string;
  start: GridPoint;
  direction: WordSearchDirection;
  points: GridPoint[];
}

export interface GeneratedWordSearch {
  grid: string[][];
  placements: WordSearchPlacement[];
}

interface CandidatePlacement extends WordSearchPlacement {
  overlap: number;
}

export function normalizeSearchWord(value: string): string[] {
  return Array.from(value.trim().toLocaleUpperCase().replace(/[\s-]+/g, ''));
}

function makeBlankGrid(size: number): string[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
}

function candidateFor(
  grid: string[][],
  term: WordSearchTerm,
  letters: string[],
  start: GridPoint,
  direction: WordSearchDirection
): CandidatePlacement | null {
  const step = DIRECTION_STEPS[direction];
  const points: GridPoint[] = [];
  let overlap = 0;

  for (let index = 0; index < letters.length; index += 1) {
    const point = {
      row: start.row + step.row * index,
      col: start.col + step.col * index
    };

    if (point.row < 0 || point.col < 0 || point.row >= grid.length || point.col >= grid.length) {
      return null;
    }

    const current = grid[point.row][point.col];
    if (current && current !== letters[index]) return null;
    if (current === letters[index]) overlap += 1;
    points.push(point);
  }

  return { termId: term.id, start, direction, points, overlap };
}

function buildAtSize(
  terms: readonly WordSearchTerm[],
  size: number,
  directions: readonly WordSearchDirection[],
  random: () => number
): GeneratedWordSearch | null {
  const grid = makeBlankGrid(size);
  const placements: WordSearchPlacement[] = [];
  const orderedTerms = [...terms].sort(
    (left, right) => normalizeSearchWord(right.word).length - normalizeSearchWord(left.word).length
  );

  for (const term of orderedTerms) {
    const letters = normalizeSearchWord(term.word);
    const candidates: CandidatePlacement[] = [];

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        for (const direction of directions) {
          const candidate = candidateFor(grid, term, letters, { row, col }, direction);
          if (candidate) candidates.push(candidate);
        }
      }
    }

    if (!candidates.length) return null;

    const maxOverlap = Math.max(...candidates.map((candidate) => candidate.overlap));
    const bestCandidates = candidates.filter((candidate) => candidate.overlap === maxOverlap);
    const selected = shuffled(bestCandidates, random)[0];

    selected.points.forEach((point, index) => {
      grid[point.row][point.col] = letters[index];
    });

    placements.push({
      termId: selected.termId,
      start: selected.start,
      direction: selected.direction,
      points: selected.points
    });
  }

  return { grid, placements };
}

export function generateWordSearch(options: {
  terms: readonly WordSearchTerm[];
  seed: number;
  size?: number;
  directions?: readonly WordSearchDirection[];
  alphabet?: string;
}): GeneratedWordSearch {
  if (!options.terms.length) throw new Error('Word search requires at least one term');

  const normalizedTerms = options.terms.map((term) => ({ ...term, word: normalizeSearchWord(term.word).join('') }));
  const maxWordLength = Math.max(...normalizedTerms.map((term) => normalizeSearchWord(term.word).length));
  const totalLetters = normalizedTerms.reduce((sum, term) => sum + normalizeSearchWord(term.word).length, 0);
  const estimatedSize = Math.ceil(Math.sqrt(totalLetters * 1.7));
  const initialSize = Math.max(options.size ?? 0, maxWordLength, estimatedSize);
  const directions = options.directions?.length ? options.directions : DEFAULT_WORD_SEARCH_DIRECTIONS;
  const random = createSeededRandom(options.seed);

  let generated: GeneratedWordSearch | null = null;
  for (let growth = 0; growth <= 6 && !generated; growth += 1) {
    generated = buildAtSize(normalizedTerms, initialSize + growth, directions, random);
  }

  if (!generated) throw new Error('Could not generate word-search grid');

  const alphabet = Array.from((options.alphabet ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').toLocaleUpperCase());
  if (!alphabet.length) throw new Error('Word-search alphabet cannot be empty');

  for (const row of generated.grid) {
    for (let col = 0; col < row.length; col += 1) {
      if (!row[col]) row[col] = alphabet[Math.floor(random() * alphabet.length)];
    }
  }

  return generated;
}
