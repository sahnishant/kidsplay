import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { extractIndexRows } from './indexers/registry.mjs';

const root = new URL('../', import.meta.url);
const knowledgeDirectory = new URL('content/knowledge/', root);
const profileDirectory = new URL('content/profile-memberships/', root);
const profileRegistryUrl = new URL('content/learning-profiles/registry.json', root);
const outputDirectory = new URL('content/index/', root);
const outputUrl = new URL('__generated-learning-index.json', outputDirectory);

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const readObjects = (directory) => readdirSync(directory)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .flatMap((name) => {
    const value = readJson(new URL(name, directory));
    return Array.isArray(value) ? value : [value];
  });

const registry = readJson(profileRegistryUrl);
const levelById = new Map((registry.knowledgeLevels ?? []).map((level) => [level.id, level]));
const profileById = new Map((registry.profiles ?? []).map((profile) => [profile.id, profile]));
const allowedFits = new Set(registry.placementFits ?? []);
const sources = readObjects(knowledgeDirectory);
const memberships = readObjects(profileDirectory);

const sourceById = new Map();
const rowsByKey = new Map();
const index = [];

for (const source of sources) {
  if (sourceById.has(source.id)) throw new Error(`Duplicate knowledge source ${source.id}`);
  sourceById.set(source.id, source);
  for (const row of extractIndexRows(source)) {
    const key = `${source.id}#${row.rowRef}`;
    if (rowsByKey.has(key)) throw new Error(`Duplicate knowledge row ${key}`);
    const level = row.meta?.knowledgeLevel ?? null;
    if (level && !levelById.has(level)) throw new Error(`${key}: unknown knowledgeLevel ${level}`);
    const indexed = {
      dataRef: source.id,
      rowRef: row.rowRef,
      datatype: `${source.kind}@${source.version}`,
      label: row.label,
      language: source.language ?? null,
      subject: source.subject ?? null,
      topic: source.topic ?? null,
      knowledgeLevel: level,
      knowledgeLevelRank: level ? levelById.get(level).rank : null,
      skills: [...new Set((row.meta?.skills ?? []).map(String))],
      profiles: []
    };
    rowsByKey.set(key, indexed);
    index.push(indexed);
  }
}

for (const membership of memberships) {
  const profile = profileById.get(membership.profileRef);
  if (!profile) throw new Error(`Unknown profileRef ${membership.profileRef}`);
  const seen = new Set();
  for (const member of membership.members ?? []) {
    const key = `${member.dataRef}#${member.rowRef}`;
    if (seen.has(key)) throw new Error(`${membership.profileRef}: duplicate member ${key}`);
    seen.add(key);
    const row = rowsByKey.get(key);
    if (!row) throw new Error(`${membership.profileRef}: unknown knowledge row ${key}`);
    if (!allowedFits.has(member.fit)) throw new Error(`${membership.profileRef}/${key}: unknown fit ${member.fit}`);
    row.profiles.push({ ...profile, profileRef: profile.id, fit: member.fit });
  }
}

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(outputUrl, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`Built cross-datatype learning index with ${index.length} row(s) across ${memberships.length} profile membership collection(s).`);
