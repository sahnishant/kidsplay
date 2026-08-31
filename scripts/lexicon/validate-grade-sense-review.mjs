import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const wordlistDir = new URL('content/lexicon/open/review-wordlists/', root);
const senseDir = new URL('content/lexicon/open/sense-review/', root);
const errors = [];
const reports = [];

const meaningFiles = readdirSync(wordlistDir)
  .filter((name) => /^grade-[1-6]-(introduced|cumulative)-meaning\.json$/.test(name))
  .sort();
if (!meaningFiles.length) errors.push('No meaning review wordlists found');

for (const filename of meaningFiles) {
  const wordlist = JSON.parse(readFileSync(new URL(filename, wordlistDir), 'utf8'));
  const senseFilename = filename.replace(/\.json$/, '-oewn.json');
  let review;
  try {
    review = JSON.parse(readFileSync(new URL(senseFilename, senseDir), 'utf8'));
  } catch {
    errors.push(`${senseFilename}: missing OEWN sense-review file`);
    continue;
  }

  const lemmas = new Set((wordlist.items ?? []).map((item) => String(item.lemma).toLocaleLowerCase('en')));
  if (review.kind !== 'lexicon_review_candidates') errors.push(`${senseFilename}: unexpected kind ${review.kind}`);
  if (review.wordlistId !== wordlist.id) errors.push(`${senseFilename}: wordlistId mismatch`);
  if (review.generatedFrom?.sourceId !== 'open-english-wordnet') errors.push(`${senseFilename}: sourceId must be open-english-wordnet`);
  if (review.generatedFrom?.sourceVersion !== '2025') errors.push(`${senseFilename}: sourceVersion must be 2025`);
  if (review.generatedFrom?.license !== 'CC-BY-4.0') errors.push(`${senseFilename}: license must be CC-BY-4.0`);
  if (review.summary?.requestedWords !== lemmas.size) errors.push(`${senseFilename}: requestedWords must equal unique wordlist lemmas`);

  const represented = new Set();
  const sensesPerLemma = new Map();
  for (const candidate of review.candidates ?? []) {
    const lemma = String(candidate.lemma ?? '').toLocaleLowerCase('en');
    if (!lemmas.has(lemma)) errors.push(`${senseFilename}: candidate lemma ${candidate.lemma} not in source wordlist`);
    represented.add(lemma);
    sensesPerLemma.set(lemma, (sensesPerLemma.get(lemma) ?? 0) + 1);
    if ((sensesPerLemma.get(lemma) ?? 0) > 3) errors.push(`${senseFilename}: ${candidate.lemma} has more than three candidate senses`);
    if (candidate.review?.status !== 'pending' || candidate.review?.selected !== false) errors.push(`${senseFilename}: ${candidate.candidateId} must remain pending/unselected`);
    if (candidate.review?.childDefinition !== null || candidate.review?.childExample !== null) errors.push(`${senseFilename}: ${candidate.candidateId} must not prefill child-facing prose`);
    if (candidate.provenance?.sourceId !== 'open-english-wordnet' || candidate.provenance?.license !== 'CC-BY-4.0') errors.push(`${senseFilename}: ${candidate.candidateId} provenance mismatch`);
    if (!Array.isArray(candidate.provenance?.upstreamIds) || candidate.provenance.upstreamIds.length < 1) errors.push(`${senseFilename}: ${candidate.candidateId} needs upstream sense/synset ids`);
  }
  for (const missing of review.missing ?? []) {
    const lemma = String(missing.lemma ?? '').toLocaleLowerCase('en');
    if (!lemmas.has(lemma)) errors.push(`${senseFilename}: missing lemma ${missing.lemma} not in source wordlist`);
    represented.add(lemma);
  }
  for (const lemma of lemmas) if (!represented.has(lemma)) errors.push(`${senseFilename}: ${lemma} is neither resolved nor explicitly missing`);

  const missingCount = review.missing?.length ?? 0;
  reports.push({
    file: senseFilename,
    requested: lemmas.size,
    candidates: review.candidates?.length ?? 0,
    missing: missingCount,
    coverage: lemmas.size ? (lemmas.size - missingCount) / lemmas.size : 0
  });
}

if (errors.length) {
  console.error(`Grade OEWN sense-review validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- ... ${errors.length - 100} more`);
  process.exitCode = 1;
} else {
  console.log('Grade OEWN sense-review OK:');
  for (const report of reports) console.log(`- ${report.file}: ${report.requested} words, ${report.candidates} sense candidates, ${report.missing} missing, ${(report.coverage * 100).toFixed(1)}% lexical coverage`);
}
