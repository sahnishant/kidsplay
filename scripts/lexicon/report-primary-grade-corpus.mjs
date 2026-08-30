import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const corpus = JSON.parse(readFileSync(new URL('content/lexicon/open/primary-grade-corpus.json', root), 'utf8'));

const rows = [];
for (let grade = 1; grade <= 6; grade += 1) {
  const entries = (corpus.entries ?? []).filter((entry) => entry.grade === grade);
  const zipfs = entries.map((entry) => entry.frequency?.zipf).filter(Number.isFinite);
  const anchored = entries.filter((entry) => (entry.gradeEvidence?.tags ?? []).some((tag) =>
    tag.startsWith('source:uk_') || tag.startsWith('source:cambridge_yle') || tag === 'source:dolch' || tag === 'source:fry'
  )).length;
  const pos = {};
  for (const entry of entries) {
    const key = entry.partOfSpeech ?? 'unknown';
    pos[key] = (pos[key] ?? 0) + 1;
  }
  rows.push({
    grade,
    entries: entries.length,
    uniqueLemmas: new Set(entries.map((entry) => entry.lemma.toLowerCase())).size,
    meanZipf: zipfs.length ? zipfs.reduce((sum, value) => sum + value, 0) / zipfs.length : null,
    anchored,
    topPos: Object.entries(pos).sort((left, right) => right[1] - left[1]).slice(0, 4)
  });
}

console.log('# Primary vocabulary grade corpus report');
console.log('');
console.log(`Source: ${corpus.source?.dataset}@${corpus.source?.revision}`);
console.log(`License: ${corpus.license}`);
console.log(`Total candidate rows: ${corpus.entries?.length ?? 0}`);
console.log('');
console.log('| Grade | Rows | Unique lemmas | Mean Zipf | Anchored rows | Top POS |');
console.log('| ---: | ---: | ---: | ---: | ---: | --- |');
for (const row of rows) {
  const topPos = row.topPos.map(([name, count]) => `${name}:${count}`).join(', ');
  console.log(`| ${row.grade} | ${row.entries} | ${row.uniqueLemmas} | ${row.meanZipf === null ? '—' : row.meanZipf.toFixed(2)} | ${row.anchored} | ${topPos} |`);
}
