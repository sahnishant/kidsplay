/**
 * Bounded equal-area allocation model. Shared by the renderer, evaluator and
 * authoring gate. No curriculum, persistence, feedback prose or scoring policy.
 * Integer target counts avoid floating-point comparisons and positional keys.
 */
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const idPattern = /^[a-z][a-z0-9-]{0,47}$/;
const boundedInteger = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export function validateEqualPartsQuestion(question) {
  const errors = [];
  if (!isRecord(question) || !isRecord(question.interaction) || !isRecord(question.solution)) return ['equal_parts requires interaction and solution objects'];
  const { interaction, solution } = question;
  if (interaction.type !== 'equal_parts' || interaction.version !== 1) errors.push('expected equal_parts@1');
  if (solution.type !== 'fraction_allocation') errors.push('expected fraction_allocation solution');
  if (typeof interaction.wholeLabel !== 'string' || !interaction.wholeLabel.trim()) errors.push('wholeLabel is required');
  if (!boundedInteger(interaction.partCount, 2, 12)) errors.push('partCount must be an integer from 2 to 12');
  if (!['circle', 'bar', 'grid'].includes(interaction.representation)) errors.push('unsupported equal-area representation');
  const categories = interaction.categories;
  if (!Array.isArray(categories) || categories.length < 2 || categories.length > 4) return [...errors, 'use 2 to 4 categories'];
  const ids = [];
  for (const category of categories) {
    if (!isRecord(category) || typeof category.id !== 'string' || !idPattern.test(category.id) || ['constructor', 'prototype', '__proto__'].includes(category.id)) {
      errors.push('category IDs must be safe stable identifiers');
      continue;
    }
    ids.push(category.id);
    if (typeof category.label !== 'string' || !category.label.trim()) errors.push(`${category.id}: label is required`);
    if (category.symbol !== undefined && (typeof category.symbol !== 'string' || !category.symbol.trim())) errors.push(`${category.id}: symbol must be non-empty text`);
  }
  if (new Set(ids).size !== ids.length) errors.push('duplicate category IDs');
  const goals = solution.fractions;
  if (!isRecord(goals)) return [...errors, 'fractions must map category IDs to rational quantities'];
  if (Object.keys(goals).length !== ids.length || Object.keys(goals).some((id) => !ids.includes(id))) errors.push('fractions must cover exactly the declared categories');
  let totalParts = 0;
  for (const id of ids) {
    const goal = Object.hasOwn(goals, id) ? goals[id] : null;
    if (!isRecord(goal) || !boundedInteger(goal.numerator, 1, 12) || !boundedInteger(goal.denominator, 2, 12) || goal.numerator > goal.denominator) {
      errors.push(`${id}: expected a positive fraction with denominator 2 to 12`);
      continue;
    }
    const product = interaction.partCount * goal.numerator;
    if (product % goal.denominator !== 0) errors.push(`${id}: the requested fraction cannot be made from these indivisible equal parts`);
    totalParts += product / goal.denominator;
  }
  if (totalParts !== interaction.partCount) errors.push('requested fractions must fill exactly one whole');
  return errors;
}

export function assertEqualPartsQuestion(question) {
  const errors = validateEqualPartsQuestion(question);
  if (errors.length) throw new Error(`Invalid equal-parts activity: ${errors.join('; ')}`);
}

export function equalPartsTargetCounts(question) {
  assertEqualPartsQuestion(question);
  return Object.fromEntries(question.interaction.categories.map(({ id }) => {
    const fraction = question.solution.fractions[id];
    return [id, question.interaction.partCount * fraction.numerator / fraction.denominator];
  }));
}

/** Strict response admission: null means empty; unknown/missing/extra cells are not silently repaired. */
export function isEqualPartsResponse(question, response) {
  if (!isRecord(response) || !Array.isArray(response.assignments) || response.assignments.length !== question.interaction.partCount) return false;
  const ids = new Set(question.interaction.categories.map(({ id }) => id));
  return Array.from(response.assignments).every((id) => id === null || (typeof id === 'string' && ids.has(id)));
}

export function evaluateEqualParts(question, response) {
  const targets = equalPartsTargetCounts(question);
  const counts = Object.fromEntries(Object.keys(targets).map((id) => [id, 0]));
  if (!isEqualPartsResponse(question, response)) return { status: 'invalid_response', correct: false, counts, targets, unassigned: question.interaction.partCount };
  let unassigned = 0;
  for (const id of response.assignments) {
    if (id === null) unassigned += 1;
    else counts[id] += 1;
  }
  const correct = unassigned === 0 && Object.entries(targets).every(([id, count]) => counts[id] === count);
  return { status: correct ? 'correct' : unassigned ? 'incomplete' : 'mismatch', correct, counts, targets, unassigned };
}

export function createEqualPartsState(question, saved) {
  assertEqualPartsQuestion(question);
  return isEqualPartsResponse(question, saved)
    ? { assignments: [...saved.assignments] }
    : { assignments: Array(question.interaction.partCount).fill(null) };
}

/** Equal central angles produce equal-area sectors; labels are not answers. */
export function equalPartSector(index, count) {
  if (!boundedInteger(count, 2, 12) || !boundedInteger(index, 0, count - 1)) throw new Error('Invalid equal sector');
  const angle = (part) => -Math.PI / 2 + part * 2 * Math.PI / count;
  const point = (part) => [100 + 96 * Math.cos(angle(part)), 100 + 96 * Math.sin(angle(part))];
  const [x1, y1] = point(index);
  const [x2, y2] = point(index + 1);
  const mid = angle(index + 0.5);
  return { path: `M 100 100 L ${x1} ${y1} A 96 96 0 0 1 ${x2} ${y2} Z`, labelX: 100 + 62 * Math.cos(mid), labelY: 100 + 62 * Math.sin(mid) };
}
