import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { normalizeData } from './normalizers/registry.mjs';
import { createMembershipResolver, readMembershipCollections } from './profileMemberships.mjs';

const root = new URL('../', import.meta.url);
const knowledgeDirectory = new URL('content/knowledge/', root);
const profileRegistryUrl = new URL('content/learning-profiles/registry.json', root);
const learningTaxonomyUrl = new URL('content/taxonomies/learning.json', root);
const outputDirectory = new URL('content/index/', root);
const outputUrl = new URL('__generated-learning-index.json', outputDirectory);

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const readObjects = (directory) => readdirSync(directory).filter((name) => name.endsWith('.json')).sort().flatMap((name) => {
  const value = readJson(new URL(name, directory));
  return Array.isArray(value) ? value : [value];
});

const profileRegistry = readJson(profileRegistryUrl);
const taxonomy = readJson(learningTaxonomyUrl);
const levelById = new Map((taxonomy.knowledgeLevels ?? []).map((level) => [level.id, level]));
const skillIds = new Set((taxonomy.skills ?? []).map((skill) => skill.id));
const profileById = new Map((profileRegistry.profiles ?? []).map((profile) => [profile.id, profile]));
const allowedFits = new Set(taxonomy.placementFits ?? []);
const sources = readObjects(knowledgeDirectory);
const membershipCollections = readMembershipCollections(root);
const membershipResolver = createMembershipResolver(membershipCollections, allowedFits);

const rowsById = new Map();
const index = [];

for (const source of sources) {
  const normalized = normalizeData(source);
  for (const unit of normalized.units) {
    if (rowsById.has(unit.rowId)) throw new Error(`Duplicate global knowledge rowId ${unit.rowId}`);
    const level = unit.meta?.knowledgeLevel ?? null;
    if (level && !levelById.has(level)) throw new Error(`${unit.rowId}: unknown knowledgeLevel ${level}`);
    const skills = [...new Set((unit.meta?.skills ?? []).map(String))];
    for (const skill of skills) if (!skillIds.has(skill)) throw new Error(`${unit.rowId}: unknown skill ${skill}`);
    const indexed = {
      rowId: unit.rowId,
      sourceRef: normalized.sourceRef,
      sourceRevision: normalized.sourceRevision,
      localId: unit.localId,
      datatype: normalized.datatype,
      label: unit.subject?.label ?? unit.prompt ?? unit.rowId,
      language: normalized.language ?? null,
      subject: normalized.subject ?? null,
      topic: normalized.topic ?? null,
      conceptIds: [...new Set(unit.conceptIds ?? [])],
      knowledgeLevel: level,
      knowledgeLevelRank: level ? levelById.get(level).rank : null,
      skills,
      profiles: []
    };
    rowsById.set(unit.rowId, indexed);
    index.push(indexed);
  }
}

for (const { value: rawMembership } of membershipCollections) {
  const profile = profileById.get(rawMembership.profileRef);
  if (!profile) throw new Error(`Unknown profileRef ${rawMembership.profileRef}`);
  const membership = membershipResolver.resolve(rawMembership.profileRef);
  const seen = new Set();
  for (const member of membership.members ?? []) {
    if (!String(member.rowId ?? '').trim()) throw new Error(`${membership.profileRef}: every member requires rowId`);
    if (seen.has(member.rowId)) throw new Error(`${membership.profileRef}: duplicate resolved member ${member.rowId}`);
    seen.add(member.rowId);
    const row = rowsById.get(member.rowId);
    if (!row) throw new Error(`${membership.profileRef}: unknown knowledge rowId ${member.rowId}`);
    if (!allowedFits.has(member.fit)) throw new Error(`${membership.profileRef}/${member.rowId}: unknown fit ${member.fit}`);
    row.profiles.push({
      ...profile,
      profileRef: profile.id,
      fit: member.fit,
      membershipOrigin: member.origin ?? 'direct',
      inheritedFromProfileRef: member.inheritedFromProfileRef ?? null
    });
  }
}

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(outputUrl, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`Built cross-datatype learning index with ${index.length} stable row(s) across ${membershipCollections.length} profile membership collection(s).`);
