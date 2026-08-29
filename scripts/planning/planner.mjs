import { normalizeData } from '../normalizers/registry.mjs';
import { getDataType, getUsableEngines } from '../formatters/registry.mjs';

const fitRank = new Map([
  ['core', 0],
  ['review', 1],
  ['stretch', 2],
  ['challenge', 3]
]);

const candidateId = (profileRef, engine, index) =>
  `plan.${profileRef.toLowerCase()}.${engine.replace('@', '.v')}.${String(index + 1).padStart(3, '0')}`;

const profileMembershipFor = (row, profileRef) =>
  (row.profiles ?? []).find((profile) => profile.profileRef === profileRef);

export function planActivities({
  sources,
  index,
  profileRef,
  skill,
  knowledgeLevels,
  count = 6,
  allowedEngines,
  difficulty = 2,
  variety = 'high'
}) {
  if (!String(profileRef ?? '').trim()) throw new Error('Planner requires profileRef');
  if (!Number.isInteger(count) || count < 1) throw new Error('Planner count must be a positive integer');

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const allowedEngineSet = allowedEngines?.length ? new Set(allowedEngines) : null;
  const levelSet = knowledgeLevels?.length ? new Set(knowledgeLevels) : null;

  const eligibleRows = index
    .filter((row) => profileMembershipFor(row, profileRef))
    .filter((row) => !skill || (row.skills ?? []).includes(skill))
    .filter((row) => !levelSet || levelSet.has(row.knowledgeLevel))
    .sort((a, b) => {
      const fitA = fitRank.get(profileMembershipFor(a, profileRef)?.fit) ?? 99;
      const fitB = fitRank.get(profileMembershipFor(b, profileRef)?.fit) ?? 99;
      if (fitA !== fitB) return fitA - fitB;
      if ((a.knowledgeLevelRank ?? 99) !== (b.knowledgeLevelRank ?? 99)) return (a.knowledgeLevelRank ?? 99) - (b.knowledgeLevelRank ?? 99);
      return a.rowId.localeCompare(b.rowId);
    });

  const rowsBySource = new Map();
  for (const row of eligibleRows) {
    const rows = rowsBySource.get(row.sourceRef) ?? [];
    rows.push(row);
    rowsBySource.set(row.sourceRef, rows);
  }

  const candidates = [];
  for (const [sourceRef, rows] of rowsBySource) {
    const rawSource = sourceById.get(sourceRef);
    if (!rawSource) throw new Error(`Planner index refers to missing source ${sourceRef}`);
    const normalized = normalizeData(rawSource);
    const rowIds = new Set(rows.map((row) => row.rowId));
    const selected = { ...normalized, units: normalized.units.filter((unit) => rowIds.has(unit.rowId)) };
    if (!selected.units.length) continue;

    const definition = getDataType(selected);
    const usableEngines = getUsableEngines(selected).filter((engine) => !allowedEngineSet || allowedEngineSet.has(engine));

    for (const engine of usableEngines) {
      const mode = definition.engineRequirements?.[engine]?.recipeUnitMode ?? 'set';
      if (!['single', 'set', 'all'].includes(mode)) throw new Error(`${selected.datatype}/${engine}: unsupported recipeUnitMode ${mode}`);

      if (mode === 'single') {
        for (const unit of selected.units) {
          candidates.push({ sourceRef, engine, rowIds: [unit.rowId], difficulty });
        }
      } else if (mode === 'all') {
        candidates.push({ sourceRef, engine, rowIds: selected.units.map((unit) => unit.rowId), difficulty });
      } else {
        candidates.push({ sourceRef, engine, rowIds: selected.units.map((unit) => unit.rowId), difficulty });
      }
    }
  }

  const selectedCandidates = [];
  const used = new Set();
  if (variety === 'high') {
    const usedEngines = new Set();
    for (const candidate of candidates) {
      if (selectedCandidates.length >= count) break;
      if (usedEngines.has(candidate.engine)) continue;
      const key = `${candidate.sourceRef}|${candidate.engine}|${candidate.rowIds.join(',')}`;
      if (used.has(key)) continue;
      used.add(key);
      usedEngines.add(candidate.engine);
      selectedCandidates.push(candidate);
    }
  }

  for (const candidate of candidates) {
    if (selectedCandidates.length >= count) break;
    const key = `${candidate.sourceRef}|${candidate.engine}|${candidate.rowIds.join(',')}`;
    if (used.has(key)) continue;
    used.add(key);
    selectedCandidates.push(candidate);
  }

  return selectedCandidates.map((candidate, indexValue) => ({
    id: candidateId(profileRef, candidate.engine, indexValue),
    profileRef,
    sourceRef: candidate.sourceRef,
    engine: candidate.engine,
    rowIds: candidate.rowIds,
    difficulty: candidate.difficulty
  }));
}
