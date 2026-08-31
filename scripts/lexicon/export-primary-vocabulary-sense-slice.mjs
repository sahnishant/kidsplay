import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_LIMIT = 40;

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else { args[key] = next; index += 1; }
  }
  return args;
};

export function buildCuratorSenseSlice(senseReview, wordlist, limit = DEFAULT_LIMIT) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer');
  if (senseReview?.generatedFrom?.sourceId !== 'open-english-wordnet' || senseReview?.generatedFrom?.license !== 'CC-BY-4.0') {
    throw new Error('Sense review must be an isolated Open English WordNet CC-BY-4.0 artifact');
  }
  const wordMeta = new Map((wordlist?.items ?? []).map((item) => [String(item.lemma).toLowerCase(), item]));
  const groups = new Map();
  for (const candidate of senseReview?.candidates ?? []) {
    const lemma = String(candidate?.lemma ?? '').toLowerCase();
    if (!lemma || !candidate?.candidateId) continue;
    groups.set(lemma, [...(groups.get(lemma) ?? []), candidate]);
  }

  const items = [...groups.entries()]
    .map(([lemma, candidates]) => {
      const meta = wordMeta.get(lemma) ?? {};
      return {
        lemma,
        grade: Number(meta.sourceGrade ?? wordlist?.selection?.grade ?? 0),
        upstreamSourceGrade: meta.upstreamSourceGrade ?? null,
        partOfSpeech: meta.partOfSpeech ?? meta.sourcePartOfSpeech ?? null,
        frequency: { zipf: meta.sourceZipf ?? null },
        priorityScore: meta.priorityScore ?? null,
        candidateSenses: candidates.map((candidate) => ({
          candidateId: candidate.candidateId,
          partOfSpeech: candidate.partOfSpeech ?? null,
          sourceSense: candidate.sourceSense,
          provenance: candidate.provenance
        })),
        review: {
          status: 'pending', decision: null, selectedCandidateId: null,
          childDefinition: null, childExample: null, notes: null
        }
      };
    })
    .sort((left, right) => Number(right.priorityScore ?? 0) - Number(left.priorityScore ?? 0) || left.lemma.localeCompare(right.lemma, 'en'))
    .slice(0, limit);

  return {
    schemaVersion: 1,
    kind: 'primary_vocabulary_curator_sense_slice',
    language: 'en',
    grade: Number(wordlist?.selection?.grade ?? items[0]?.grade ?? 0),
    purpose: 'Human sense selection and child-definition authoring. Candidate glosses are reference-only CC-BY material and are never copied automatically into runtime knowledge.',
    generatedFrom: {
      wordlistId: senseReview?.wordlistId ?? wordlist?.id ?? null,
      sourceId: 'open-english-wordnet',
      sourceVersion: senseReview?.generatedFrom?.sourceVersion ?? null,
      license: 'CC-BY-4.0'
    },
    policy: {
      importedGlossRuntimeAllowed: false,
      explicitHumanDecisionRequired: true,
      kidsplayChildDefinitionRequiredForAccept: true
    },
    summary: {
      words: items.length,
      candidateSenses: items.reduce((sum, item) => sum + item.candidateSenses.length, 0)
    },
    items
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args['sense-review'] || !args.wordlist || !args.output) throw new Error('--sense-review, --wordlist and --output are required');
  const limit = Number(args.limit || DEFAULT_LIMIT);
  const senseReview = JSON.parse(readFileSync(resolve(String(args['sense-review'])), 'utf8'));
  const wordlist = JSON.parse(readFileSync(resolve(String(args.wordlist)), 'utf8'));
  const output = resolve(String(args.output));
  const slice = buildCuratorSenseSlice(senseReview, wordlist, limit);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(slice, null, 2)}\n`, 'utf8');
  console.log(`Curator sense slice written: grade=${slice.grade}, words=${slice.summary.words}, senses=${slice.summary.candidateSenses} -> ${output}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
