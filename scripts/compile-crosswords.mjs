import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const authoringDirectory = new URL('content/authoring/crosswords/', root);
const outputUrl = new URL('content/questions/__generated-crosswords.json', root);
const GRID_SIZE = 31;
const CENTER = Math.floor(GRID_SIZE / 2);

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const cellKey = (row, col) => `${row},${col}`;
const normalizeAnswer = (value) => String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function compileCrossword(question) {
  if (!question?.id) throw new Error('Crossword authoring item is missing id');
  if (!Array.isArray(question.entries) || question.entries.length < 2) {
    throw new Error(`${question.id}: crossword needs at least two entries`);
  }

  const entryIds = new Set();
  const entries = question.entries.map((entry) => {
    if (!entry?.id || entryIds.has(entry.id)) throw new Error(`${question.id}: duplicate/missing entry id ${entry?.id}`);
    entryIds.add(entry.id);
    const answer = normalizeAnswer(entry.answer);
    if (answer.length < 2) throw new Error(`${question.id}/${entry.id}: answer needs at least two letters`);
    if (!String(entry.clue ?? '').trim()) throw new Error(`${question.id}/${entry.id}: clue is required`);
    return { id: entry.id, clue: String(entry.clue), answer };
  });

  const grid = new Map();
  const placed = [];
  const orderedForPlacement = [...entries].sort(
    (left, right) => right.answer.length - left.answer.length || left.id.localeCompare(right.id)
  );

  const getCell = (row, col) => grid.get(cellKey(row, col));

  const place = (entry, row, col, direction) => {
    for (let index = 0; index < entry.answer.length; index += 1) {
      const targetRow = row + (direction === 'down' ? index : 0);
      const targetCol = col + (direction === 'across' ? index : 0);
      const key = cellKey(targetRow, targetCol);
      const existing = grid.get(key) ?? { letter: entry.answer[index], across: false, down: false };
      existing.letter = entry.answer[index];
      existing[direction] = true;
      grid.set(key, existing);
    }
    placed.push({ ...entry, row, col, direction });
  };

  const scorePlacement = (entry, row, col, direction) => {
    const endRow = row + (direction === 'down' ? entry.answer.length - 1 : 0);
    const endCol = col + (direction === 'across' ? entry.answer.length - 1 : 0);
    if ([row, col, endRow, endCol].some((value) => value < 0 || value >= GRID_SIZE)) return null;

    const beforeRow = row - (direction === 'down' ? 1 : 0);
    const beforeCol = col - (direction === 'across' ? 1 : 0);
    const afterRow = endRow + (direction === 'down' ? 1 : 0);
    const afterCol = endCol + (direction === 'across' ? 1 : 0);
    if (getCell(beforeRow, beforeCol) || getCell(afterRow, afterCol)) return null;

    let intersections = 0;

    for (let index = 0; index < entry.answer.length; index += 1) {
      const targetRow = row + (direction === 'down' ? index : 0);
      const targetCol = col + (direction === 'across' ? index : 0);
      const existing = getCell(targetRow, targetCol);
      const expectedLetter = entry.answer[index];

      if (existing) {
        if (existing.letter !== expectedLetter || existing[direction]) return null;
        intersections += 1;
        continue;
      }

      const sideA = direction === 'across' ? getCell(targetRow - 1, targetCol) : getCell(targetRow, targetCol - 1);
      const sideB = direction === 'across' ? getCell(targetRow + 1, targetCol) : getCell(targetRow, targetCol + 1);
      if (sideA || sideB) return null;
    }

    if (placed.length && intersections === 0) return null;

    const rows = [...placed.map((value) => value.row), row, endRow];
    const cols = [...placed.map((value) => value.col), col, endCol];
    const area = (Math.max(...rows) - Math.min(...rows) + 1) * (Math.max(...cols) - Math.min(...cols) + 1);
    const distance = Math.abs((row + endRow) / 2 - CENTER) + Math.abs((col + endCol) / 2 - CENTER);
    return intersections * 1000 - area - distance;
  };

  const first = orderedForPlacement[0];
  place(first, CENTER, CENTER - Math.floor(first.answer.length / 2), 'across');

  for (const entry of orderedForPlacement.slice(1)) {
    let best = null;
    const seenCandidates = new Set();

    for (let index = 0; index < entry.answer.length; index += 1) {
      const letter = entry.answer[index];
      for (const [key, cell] of grid) {
        if (cell.letter !== letter) continue;
        const [crossRow, crossCol] = key.split(',').map(Number);

        for (const direction of ['across', 'down']) {
          const row = crossRow - (direction === 'down' ? index : 0);
          const col = crossCol - (direction === 'across' ? index : 0);
          const candidateKey = `${row},${col},${direction}`;
          if (seenCandidates.has(candidateKey)) continue;
          seenCandidates.add(candidateKey);

          const score = scorePlacement(entry, row, col, direction);
          if (score === null) continue;
          if (!best || score > best.score) best = { row, col, direction, score };
        }
      }
    }

    if (!best) {
      throw new Error(`${question.id}: could not connect crossword entry ${entry.id}; adjust the answer set`);
    }
    place(entry, best.row, best.col, best.direction);
  }

  const occupied = [...grid.keys()].map((key) => key.split(',').map(Number));
  const minRow = Math.min(...occupied.map(([row]) => row));
  const maxRow = Math.max(...occupied.map(([row]) => row));
  const minCol = Math.min(...occupied.map(([, col]) => col));
  const maxCol = Math.max(...occupied.map(([, col]) => col));

  const trimmed = placed.map((entry) => ({
    ...entry,
    row: entry.row - minRow,
    col: entry.col - minCol
  }));

  const startNumbers = new Map();
  let nextNumber = 1;
  for (const entry of [...trimmed].sort((left, right) => left.row - right.row || left.col - right.col)) {
    const key = cellKey(entry.row, entry.col);
    if (!startNumbers.has(key)) startNumbers.set(key, nextNumber++);
  }

  const compiledEntries = trimmed
    .map((entry) => ({
      id: entry.id,
      clue: entry.clue,
      number: startNumbers.get(cellKey(entry.row, entry.col)),
      direction: entry.direction,
      startRow: entry.row,
      startCol: entry.col,
      length: entry.answer.length
    }))
    .sort((left, right) => left.number - right.number || left.direction.localeCompare(right.direction));

  const { entries: _authoringEntries, ...baseQuestion } = question;
  return {
    ...baseQuestion,
    interaction: {
      type: 'crossword',
      version: 1,
      rows: maxRow - minRow + 1,
      cols: maxCol - minCol + 1,
      entries: compiledEntries
    },
    solution: {
      type: 'crossword_answers',
      answers: Object.fromEntries(entries.map((entry) => [entry.id, entry.answer]))
    },
    authoring: {
      ...question.authoring,
      compiledBy: 'crossword-layout-v1'
    }
  };
}

const files = readdirSync(authoringDirectory).filter((name) => name.endsWith('.json')).sort();
const sourceQuestions = files.flatMap((file) => {
  const value = readJson(new URL(file, authoringDirectory));
  if (!Array.isArray(value)) throw new Error(`${file}: expected an array of crossword authoring items`);
  return value;
});

const compiled = sourceQuestions.map(compileCrossword);
writeFileSync(outputUrl, `${JSON.stringify(compiled, null, 2)}\n`, 'utf8');
console.log(`Compiled ${compiled.length} crossword question(s).`);
