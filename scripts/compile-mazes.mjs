import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const authoringDirectory = new URL('content/authoring/mazes/', root);
const outputUrl = new URL('content/questions/__generated-mazes.json', root);

const WALL_TOP = 1;
const WALL_RIGHT = 2;
const WALL_BOTTOM = 4;
const WALL_LEFT = 8;
const ALL_WALLS = WALL_TOP | WALL_RIGHT | WALL_BOTTOM | WALL_LEFT;
const directions = [
  { dr: -1, dc: 0, wall: WALL_TOP, opposite: WALL_BOTTOM },
  { dr: 0, dc: 1, wall: WALL_RIGHT, opposite: WALL_LEFT },
  { dr: 1, dc: 0, wall: WALL_BOTTOM, opposite: WALL_TOP },
  { dr: 0, dc: -1, wall: WALL_LEFT, opposite: WALL_RIGHT }
];

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function compileMaze(question) {
  if (!question?.id) throw new Error('Maze authoring item is missing id');
  const maze = question.maze;
  if (!maze || !Number.isInteger(maze.rows) || !Number.isInteger(maze.cols) || maze.rows < 2 || maze.cols < 2) {
    throw new Error(`${question.id}: maze rows/cols must be integers >= 2`);
  }
  if (maze.rows > 20 || maze.cols > 20) throw new Error(`${question.id}: maze is too large for the lightweight runtime`);
  if (!Number.isInteger(maze.seed)) throw new Error(`${question.id}: maze seed must be an integer`);

  const inBounds = (row, col) => row >= 0 && col >= 0 && row < maze.rows && col < maze.cols;
  for (const [name, point] of [['start', maze.start], ['goal', maze.goal]]) {
    if (!point || !Number.isInteger(point.row) || !Number.isInteger(point.col) || !inBounds(point.row, point.col)) {
      throw new Error(`${question.id}: ${name} must be inside the maze`);
    }
  }

  const toIndex = (row, col) => row * maze.cols + col;
  const startIndex = toIndex(maze.start.row, maze.start.col);
  const goalIndex = toIndex(maze.goal.row, maze.goal.col);
  if (startIndex === goalIndex) throw new Error(`${question.id}: maze start and goal must differ`);

  const wallMasks = Array(maze.rows * maze.cols).fill(ALL_WALLS);
  const visited = new Set([startIndex]);
  const stack = [startIndex];
  const random = createSeededRandom(maze.seed);

  while (stack.length) {
    const current = stack[stack.length - 1];
    const row = Math.floor(current / maze.cols);
    const col = current % maze.cols;
    const candidates = directions
      .map((direction) => ({ ...direction, row: row + direction.dr, col: col + direction.dc }))
      .filter((candidate) => inBounds(candidate.row, candidate.col))
      .map((candidate) => ({ ...candidate, index: toIndex(candidate.row, candidate.col) }))
      .filter((candidate) => !visited.has(candidate.index));

    if (!candidates.length) {
      stack.pop();
      continue;
    }

    const chosen = candidates[Math.floor(random() * candidates.length)];
    wallMasks[current] &= ~chosen.wall;
    wallMasks[chosen.index] &= ~chosen.opposite;
    visited.add(chosen.index);
    stack.push(chosen.index);
  }

  const { maze: _authoringMaze, ...baseQuestion } = question;
  return {
    ...baseQuestion,
    interaction: {
      type: 'maze_path',
      version: 1,
      rows: maze.rows,
      cols: maze.cols,
      wallMasks,
      startIndex,
      goalIndex,
      startLabel: String(maze.start.label ?? 'Start'),
      startSymbol: String(maze.start.symbol ?? '●'),
      goalLabel: String(maze.goal.label ?? 'Goal'),
      goalSymbol: String(maze.goal.symbol ?? '★')
    },
    solution: {
      type: 'maze_goal',
      goalIndex
    },
    authoring: {
      ...question.authoring,
      compiledBy: 'maze-dfs-v1'
    }
  };
}

const files = readdirSync(authoringDirectory).filter((name) => name.endsWith('.json')).sort();
const sourceQuestions = files.flatMap((file) => {
  const value = readJson(new URL(file, authoringDirectory));
  if (!Array.isArray(value)) throw new Error(`${file}: expected an array of maze authoring items`);
  return value;
});

const compiled = sourceQuestions.map(compileMaze);
writeFileSync(outputUrl, `${JSON.stringify(compiled, null, 2)}\n`, 'utf8');
console.log(`Compiled ${compiled.length} maze question(s).`);
