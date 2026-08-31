import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_REVIEW_DIR = 'content/lexicon/reviews';
const DEFAULT_SLICE_DIR = 'content/lexicon/open/curator-slices';
const DEFAULT_OUTPUT = 'content/knowledge/english-vocabulary-primary-reviewed.json';

const clean = (value) => String(value ?? '').trim();
const slug = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function jsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort().map((name) => resolve(directory, name));
}

function candidateIndex(sliceDir) {
  const index = new Map();
  for (const file of jsonFiles(sliceDir)) {
    const slice = JSON.parse(readFileSync(file, 'utf8'));
    if (slice?.generatedFrom?.sourceId !== 'open-english-wordnet' || slice?.generatedFrom?.license !== 'CC-BY-4.0') {
      throw new Error(`${file}: curator slice must preserve isolated OEWN CC-BY-4.0 provenance`);
    }
    for (const item of slice.items ?? []) {
      for (const candidate of item.candidateSenses ?? []) {
        if (index.has(candidate.candidateId)) throw new Error(`Duplicate candidate id ${candidate.candidateId}`);
        index.set(candidate.candidateId, { item, candidate, slice, file });
      }
    }
  }
  return index;
}

function loadDecisions(reviewDir) {
  const decisions = [];
  for (const file of jsonFiles(reviewDir)) {
    const document = JSON.parse(readFileSync(file, 'utf8'));
    for (const decision of document.decisions ?? []) decisions.push({ ...decision, decisionFile: file });
  }
  return decisions;
}

export function buildReviewedKnowledge(decisions, candidates) {
  const accepted = [];
  const seenLemmas = new Set();
  for (const decision of decisions) {
    if (decision?.status !== 'reviewed' || decision?.decision !== 'accept') continue;
    const candidateId = clean(decision.candidateId);
    const match = candidates.get(candidateId);
    if (!match) throw new Error(`${decision.decisionFile ?? 'review'}: unknown candidateId ${candidateId}`);
    const lemma = clean(decision.lemma).toLowerCase();
    if (!lemma || lemma !== String(match.item.lemma).toLowerCase()) throw new Error(`${candidateId}: decision lemma does not match candidate lemma`);
    const childDefinition = clean(decision.childDefinition);
    if (childDefinition.length < 3 || childDefinition.length > 180) throw new Error(`${candidateId}: accepted decision requires a concise Kidsplay childDefinition`);
    if (childDefinition === clean(match.candidate?.sourceSense?.definition)) throw new Error(`${candidateId}: childDefinition must not copy the OEWN gloss verbatim`);
    const reviewer = clean(decision.reviewer);
    const reviewedAt = clean(decision.reviewedAt);
    if (!reviewer || !/^\d{4}-\d{2}-\d{2}/.test(reviewedAt)) throw new Error(`${candidateId}: reviewer and reviewedAt are required`);
    if (seenLemmas.has(lemma)) throw new Error(`${lemma}: only one accepted sense per lemma may be imported in this seed lane`);
    seenLemmas.add(lemma);

    const senseId = clean(match.candidate?.sourceSense?.senseId);
    const synsetId = clean(match.candidate?.sourceSense?.synsetId);
    accepted.push({
      id: lemma,
      rowId: `kr.vocab.primary.meaning.${slug(lemma)}.${slug(candidateId)}`,
      subject: { id: lemma, label: lemma },
      relation: 'means',
      object: { id: `${lemma}-object`, label: childDefinition },
      conceptIds: [`vocabulary.meaning.${slug(lemma)}`],
      meta: {
        knowledgeLevel: Number(match.item.grade) <= 2 ? 'foundation' : 'basic',
        skills: ['vocabulary', 'recall'],
        primaryVocabularyGrade: Number(match.item.grade),
        curation: {
          status: 'reviewed', reviewer, reviewedAt, candidateId,
          sourceId: 'open-english-wordnet',
          sourceVersion: match.slice?.generatedFrom?.sourceVersion ?? null,
          sourceLicense: 'CC-BY-4.0',
          sourceSenseId: senseId || null,
          sourceSynsetId: synsetId || null,
          sourceGlossCopied: false
        }
      }
    });
  }

  accepted.sort((left, right) => left.subject.label.localeCompare(right.subject.label, 'en'));
  if (!accepted.length) return [];
  return [{
    schemaVersion: 1,
    id: 'knowledge.english.vocabulary.primary-reviewed.001',
    kind: 'association_set',
    version: 1,
    language: 'en',
    subject: 'English',
    topic: 'Vocabulary - Reviewed Primary Meanings',
    entries: accepted,
    authoring: {
      status: 'reviewed',
      source: 'kidsplay-editorial-oewn-sense-review',
      scopeNote: 'Sense IDs come from the isolated OEWN review lane; child-facing definitions are independently authored by Kidsplay reviewers and source glosses are not copied.'
    }
  }];
}

function parseArgs(argv) {
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
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const reviewDir = resolve(String(args['review-dir'] || DEFAULT_REVIEW_DIR));
  const sliceDir = resolve(String(args['slice-dir'] || DEFAULT_SLICE_DIR));
  const output = resolve(String(args.output || DEFAULT_OUTPUT));
  const candidates = candidateIndex(sliceDir);
  const decisions = loadDecisions(reviewDir);
  const knowledge = buildReviewedKnowledge(decisions, candidates);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(knowledge, null, 2)}\n`, 'utf8');
  console.log(`Reviewed primary vocabulary imported: ${knowledge[0]?.entries?.length ?? 0} semantic rows -> ${output}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) main();
