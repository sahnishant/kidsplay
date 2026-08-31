import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { selectGradeReviewWordlist } from './select-grade-vocabulary.mjs';

const DEFAULT_CORPUS = 'content/lexicon/open/primary-grade-corpus.json';
const DEFAULT_KNOWLEDGE_DIR = 'content/knowledge';
const DEFAULT_OUTPUT_DIR = 'content/lexicon/open/profile-slices';
const DEFAULT_LIMIT = 100;

const clean = (value) => String(value ?? '').trim();
const normalizeLemma = (value) => clean(value).toLocaleLowerCase('en');

function asDocuments(source) {
  const data = source && typeof source === 'object' && Object.hasOwn(source, 'data') ? source.data : source;
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export function collectReviewedVocabularyMeaningRows(knowledgeDocuments) {
  const rowsByLemma = new Map();
  for (const source of knowledgeDocuments ?? []) {
    for (const document of asDocuments(source)) {
      if (!document || document.authoring?.status !== 'reviewed') continue;
      for (const entry of document.entries ?? []) {
        if (entry?.relation !== 'means') continue;
        const rowId = clean(entry.rowId);
        const lemma = normalizeLemma(entry.subject?.label || entry.subject?.id);
        if (!rowId || !lemma) continue;
        const existing = rowsByLemma.get(lemma) ?? new Set();
        existing.add(rowId);
        rowsByLemma.set(lemma, existing);
      }
    }
  }
  return new Map([...rowsByLemma.entries()].map(([lemma, rowIds]) => [lemma, [...rowIds].sort()]));
}

function resolveProfileWordlist(corpus, grade, mode, limit, suppliedWordlist) {
  const wordlist = suppliedWordlist ?? selectGradeReviewWordlist(corpus, grade, limit, mode, 'meaning');
  if (!wordlist || !Array.isArray(wordlist.items)) throw new Error('Profile slice wordlist requires an items array');
  if (wordlist.sourceId !== 'open-english-wordnet') {
    throw new Error(`Profile slice meaning wordlist must use open-english-wordnet, got ${wordlist.sourceId ?? '<none>'}`);
  }
  if (Number(wordlist.selection?.grade) !== grade) {
    throw new Error(`Profile slice wordlist grade ${wordlist.selection?.grade} does not match requested grade ${grade}`);
  }
  if (clean(wordlist.selection?.mode) !== mode) {
    throw new Error(`Profile slice wordlist mode ${wordlist.selection?.mode} does not match requested mode ${mode}`);
  }
  if (clean(wordlist.selection?.purpose) !== 'meaning') {
    throw new Error(`Profile slice wordlist purpose must be meaning, got ${wordlist.selection?.purpose ?? '<none>'}`);
  }
  if (wordlist.sourceGradeCorpus?.id && wordlist.sourceGradeCorpus.id !== corpus.id) {
    throw new Error(`Profile slice wordlist corpus ${wordlist.sourceGradeCorpus.id} does not match ${corpus.id}`);
  }
  if (
    wordlist.sourceGradeCorpus?.sourceRevision
    && corpus.source?.revision
    && wordlist.sourceGradeCorpus.sourceRevision !== corpus.source.revision
  ) {
    throw new Error(
      `Profile slice wordlist source revision ${wordlist.sourceGradeCorpus.sourceRevision} does not match corpus ${corpus.source.revision}`
    );
  }

  return {
    wordlist,
    items: wordlist.items.slice(0, limit)
  };
}

export function buildPrimaryVocabularyProfileSlice(corpus, knowledgeDocuments, membership, options = {}) {
  const profileRef = clean(options.profileRef || membership?.profileRef);
  if (!profileRef) throw new Error('profileRef is required');
  if (membership?.profileRef && membership.profileRef !== profileRef) {
    throw new Error(`profileRef ${profileRef} does not match membership ${membership.profileRef}`);
  }

  const grade = Number(options.grade);
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new Error('grade must be an integer from 1 to 6');
  const mode = clean(options.mode || 'introduced');
  if (!['introduced', 'cumulative'].includes(mode)) throw new Error('mode must be introduced or cumulative');
  const limit = Number(options.limit || DEFAULT_LIMIT);
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer');

  const { wordlist, items } = resolveProfileWordlist(corpus, grade, mode, limit, options.wordlist);
  const reviewedRows = collectReviewedVocabularyMeaningRows(knowledgeDocuments);
  const membershipByRow = new Map((membership?.members ?? []).map((member) => [clean(member.rowId), clean(member.fit) || null]));

  const readyForProfileReview = [];
  const pendingEditorialReview = [];
  let alreadyInProfileWords = 0;
  let alreadyInProfileRows = 0;

  for (const candidate of items) {
    const rowIds = reviewedRows.get(normalizeLemma(candidate.lemma)) ?? [];
    if (!rowIds.length) {
      pendingEditorialReview.push({
        lemma: candidate.lemma,
        sourceCorpusId: candidate.sourceCorpusId,
        sourceGrade: candidate.sourceGrade,
        sourcePartOfSpeech: candidate.sourcePartOfSpeech,
        reviewNeeded: ['kidsplay_child_definition', 'profile_placement']
      });
      continue;
    }

    const existingProfileMemberships = rowIds
      .filter((rowId) => membershipByRow.has(rowId))
      .map((rowId) => ({ rowId, fit: membershipByRow.get(rowId) }));
    if (existingProfileMemberships.length) {
      alreadyInProfileWords += 1;
      alreadyInProfileRows += existingProfileMemberships.length;
    }

    readyForProfileReview.push({
      lemma: candidate.lemma,
      sourceCorpusId: candidate.sourceCorpusId,
      sourceGrade: candidate.sourceGrade,
      sourcePartOfSpeech: candidate.sourcePartOfSpeech,
      sourceZipf: candidate.sourceZipf,
      sourceTags: candidate.sourceTags,
      kidsplayRowIds: rowIds,
      existingProfileMemberships
    });
  }

  return {
    schemaVersion: 1,
    id: `vocabulary.primary.profile-slice.${profileRef}.grade${grade}.${mode}.meaning.review`,
    language: 'en',
    profileRef,
    status: 'curation_review_only',
    sourceGradeCorpus: wordlist.sourceGradeCorpus,
    sourceSelection: {
      id: wordlist.id,
      grade,
      mode,
      purpose: 'meaning',
      requested: wordlist.selection.requested,
      selected: wordlist.selection.selected,
      sliceLimit: limit,
      sliceSelected: items.length,
      algorithm: wordlist.selection.algorithm,
      semanticResolution: wordlist.selection.semanticResolution ?? null
    },
    policy: {
      runtimeContent: false,
      mutatesKnowledge: false,
      mutatesProfileMembership: false,
      sourceDefinitionsIncluded: false,
      sourceExamplesIncluded: false,
      boardAlignmentClaimed: false,
      kidsplayDefinitionRequired: true,
      profilePlacementRequiresEditorialReview: true
    },
    summary: {
      selectedCandidates: items.length,
      reviewedCandidateWords: readyForProfileReview.length,
      alreadyInProfileWords,
      alreadyInProfileRows,
      pendingEditorialWords: pendingEditorialReview.length
    },
    readyForProfileReview,
    pendingEditorialReview
  };
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

function loadKnowledgeDocuments(directory) {
  return readdirSync(directory)
    .filter((filename) => filename.endsWith('.json'))
    .sort()
    .map((filename) => ({
      filename,
      data: JSON.parse(readFileSync(resolve(directory, filename), 'utf8'))
    }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const profileRef = clean(args.profile);
  const grade = Number(args.grade);
  if (!profileRef) throw new Error('--profile <PROFILE_REF> is required');
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new Error('--grade must be an integer from 1 to 6');

  const limit = Number(args.limit || DEFAULT_LIMIT);
  if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit must be a positive integer');
  const mode = clean(args.mode || 'introduced');
  if (!['introduced', 'cumulative'].includes(mode)) throw new Error('--mode must be introduced or cumulative');

  const corpusPath = resolve(String(args.corpus || DEFAULT_CORPUS));
  const knowledgeDir = resolve(String(args['knowledge-dir'] || DEFAULT_KNOWLEDGE_DIR));
  const membershipPath = resolve(String(args.membership || `content/profile-memberships/${profileRef}.json`));
  const outputPath = resolve(String(args.output || `${DEFAULT_OUTPUT_DIR}/${profileRef}-grade-${grade}-${mode}-meaning.json`));

  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
  const membership = JSON.parse(readFileSync(membershipPath, 'utf8'));
  const suppliedWordlist = args.wordlist
    ? JSON.parse(readFileSync(resolve(String(args.wordlist)), 'utf8'))
    : null;
  const slice = buildPrimaryVocabularyProfileSlice(
    corpus,
    loadKnowledgeDocuments(knowledgeDir),
    membership,
    { profileRef, grade, mode, limit, wordlist: suppliedWordlist }
  );

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(slice, null, 2)}\n`, 'utf8');
  console.log(`Primary vocabulary profile slice written: ${outputPath}`);
  console.log(`Profile slice summary: ${JSON.stringify(slice.summary)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
