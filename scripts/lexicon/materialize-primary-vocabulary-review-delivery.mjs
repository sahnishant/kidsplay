import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');
const reviewDir = resolve(root, 'content/lexicon/reviews');
const knowledgeDir = resolve(root, 'content/knowledge');
const profileDir = resolve(root, 'content/profile-memberships');
const recipeDir = resolve(root, 'content/recipes');
const freePackPath = resolve(root, 'content/packs/free-vocabulary.json');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeCompact = (path, value) => writeFileSync(path, `${JSON.stringify(value)}\n`, 'utf8');
const slug = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function reviewFiles() {
  return readdirSync(reviewDir)
    .filter((name) => /^grade-\d+-batch-\d+\.json$/.test(name))
    .sort();
}

function knowledgePath(batch) {
  return batch === '001'
    ? resolve(knowledgeDir, 'english-vocabulary-primary-reviewed.json')
    : resolve(knowledgeDir, `english-vocabulary-primary-reviewed-batch-${batch}.json`);
}

function loadReviewedRows() {
  const rowsByBatchLemma = new Map();
  const placements = [];
  for (const name of reviewFiles()) {
    const review = readJson(resolve(reviewDir, name));
    const match = /^grade-\d+-batch-(\d+)$/.exec(String(review.batchId ?? ''));
    if (!match) throw new Error(`${name}: invalid reviewed vocabulary batchId`);
    const batch = match[1].padStart(3, '0');
    const path = knowledgePath(batch);
    if (!existsSync(path)) throw new Error(`${name}: generated knowledge missing for batch ${batch}`);
    const knowledge = readJson(path);
    const entries = knowledge[0]?.entries ?? [];
    const entryByLemma = new Map(entries.map((entry) => [entry.id, entry]));

    for (const decision of review.decisions ?? []) {
      if (decision.status !== 'reviewed' || decision.decision !== 'accept') continue;
      if (decision.reviewAuthority !== 'human_editor') throw new Error(`${name}/${decision.lemma}: accepted review requires human_editor authority`);
      const entry = entryByLemma.get(decision.lemma);
      if (!entry) throw new Error(`${name}/${decision.lemma}: accepted review has no generated knowledge row`);
      if (entry.meta?.curation?.candidateId !== decision.candidateId) throw new Error(`${name}/${decision.lemma}: generated candidate does not match human review`);
      rowsByBatchLemma.set(`${batch}:${decision.lemma}`, entry);
    }

    for (const placement of review.profilePlacements ?? []) {
      if (placement.status !== 'reviewed' || placement.reviewAuthority !== 'human_editor') {
        throw new Error(`${name}/${placement.lemma}: profile placement requires explicit human_editor review`);
      }
      const entry = rowsByBatchLemma.get(`${batch}:${placement.lemma}`);
      if (!entry) throw new Error(`${name}/${placement.lemma}: profile placement has no accepted meaning in the same batch`);
      placements.push({ name, batch, placement, entry });
    }
  }
  return { rowsByBatchLemma, placements };
}

function materializeProfilePlacements(placements) {
  const touched = new Map();
  for (const { name, placement, entry } of placements) {
    for (const profileRef of placement.approvedProfileRefs ?? []) {
      const path = resolve(profileDir, `${profileRef}.json`);
      if (!existsSync(path)) throw new Error(`${name}/${placement.lemma}: unknown profile ${profileRef}`);
      const profile = touched.get(profileRef) ?? readJson(path);
      if (profile.profileRef !== profileRef) throw new Error(`${path}: profileRef mismatch`);
      if (profile.provenance?.status !== 'prototype_unverified') {
        throw new Error(`${profileRef}: reviewed vocabulary placement must not inflate curriculum provenance`);
      }
      const prefix = `kr.vocab.primary.meaning.${slug(placement.lemma)}.`;
      const stale = (profile.members ?? []).find((member) => String(member.rowId).startsWith(prefix) && member.rowId !== entry.rowId);
      if (stale) throw new Error(`${profileRef}/${placement.lemma}: stale reviewed vocabulary sense ${stale.rowId}; expected ${entry.rowId}`);
      if (!(profile.members ?? []).some((member) => member.rowId === entry.rowId)) {
        profile.members.push({ rowId: entry.rowId, fit: 'core' });
      }
      touched.set(profileRef, profile);
    }
  }
  for (const [profileRef, profile] of touched) writeCompact(resolve(profileDir, `${profileRef}.json`), profile);
  return touched.size;
}

function sourceEntries(sourceRef) {
  const match = /^knowledge\.english\.vocabulary\.primary-reviewed\.(\d{3})$/.exec(String(sourceRef ?? ''));
  if (!match) return null;
  const knowledge = readJson(knowledgePath(match[1]));
  return knowledge[0]?.entries ?? [];
}

function reviewedLaunchRefs() {
  const refs = [];
  for (const name of readdirSync(recipeDir).filter((entry) => entry.endsWith('.json')).sort()) {
    const value = readJson(resolve(recipeDir, name));
    const recipes = Array.isArray(value) ? value : [value];
    for (const recipe of recipes) {
      if (!String(recipe.sourceRef ?? '').startsWith('knowledge.english.vocabulary.primary-reviewed.')) continue;
      if (recipe.forEachEntry) {
        const entries = sourceEntries(recipe.sourceRef);
        if (!entries?.length) throw new Error(`${recipe.id}: reviewed vocabulary source is empty`);
        const known = new Set(entries.map((entry) => String(entry.id)));
        const include = recipe.includeEntryIds?.length ? recipe.includeEntryIds.map(String) : [...known];
        for (const entryId of include) {
          if (!known.has(entryId)) throw new Error(`${recipe.id}: unknown reviewed entry ${entryId}`);
          refs.push(`${recipe.id}.${entryId}`);
        }
      } else {
        refs.push(recipe.id);
      }
    }
  }
  return refs;
}

function materializeFreeVocabularyPack() {
  const pack = readJson(freePackPath);
  const existing = new Set(pack.questionRefs ?? []);
  const refs = reviewedLaunchRefs();
  for (const ref of refs) {
    if (!existing.has(ref)) {
      pack.questionRefs.push(ref);
      existing.add(ref);
    }
  }
  writeCompact(freePackPath, pack);
  return refs.length;
}

const { placements } = loadReviewedRows();
const touchedProfiles = materializeProfilePlacements(placements);
const reviewedRefs = materializeFreeVocabularyPack();
console.log(`Materialized reviewed vocabulary delivery: ${placements.length} profile placement(s), ${touchedProfiles} profile file(s), ${reviewedRefs} reviewed launch ref(s) reachable from the free vocabulary pack.`);
