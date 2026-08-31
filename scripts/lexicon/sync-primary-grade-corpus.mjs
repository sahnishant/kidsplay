import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DATASET_ID = 'cstr/grundwortschatz-voc-en';
const CONFIG = 'default';
const SPLIT = 'words';
const LICENSE = 'CC-BY-SA-4.0';
const PAGE_SIZE = 100;
const MIN_EXPECTED_ROWS = 10_000;
const DEFAULT_OUTPUT = 'content/lexicon/open/primary-grade-corpus.json';
const REQUEST_PACING_MS = 300;
const MAX_FETCH_ATTEMPTS = 9;

const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

const parseJsonObject = (value) => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const asFiniteNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const asInteger = (value) => Number.isInteger(Number(value)) ? Number(value) : null;
const cleanText = (value) => typeof value === 'string' ? value.trim() : '';

const compactTags = (metadata) => {
  const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
  return [...new Set(tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter((tag) => tag && tag.length <= 96)
  )].sort();
};

const compactRow = (row) => {
  const frequency = parseJsonObject(row.frequency_json);
  const metadata = parseJsonObject(row.metadata_json);
  const grade = asInteger(row.grade_level ?? metadata.gradeLevelEstimate);
  const id = cleanText(row.original_id);
  const word = cleanText(row.word);
  const lemma = cleanText(row.lemma) || word;
  if (!id || !word || !lemma) throw new Error('Source row is missing original_id, word or lemma');
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new Error(`${id}: invalid grade ${row.grade_level}`);

  return {
    id,
    word,
    lemma,
    partOfSpeech: cleanText(row.word_type) || null,
    grade,
    frequency: {
      zipf: asFiniteNumber(frequency.zipf),
      perMillion: asFiniteNumber(frequency.per_million),
      band: asInteger(frequency.frequency_band)
    },
    gradeEvidence: {
      reason: cleanText(metadata.gradeReason) || null,
      cefrLevel: cleanText(metadata.cefr_level) || null,
      yleLevel: cleanText(metadata.yle_level) || null,
      tags: compactTags(metadata)
    },
    reviewStatus: 'candidate'
  };
};

function retryDelayMs(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.ceil(retryAfter * 1000) + 500;
  return Math.min(30_000, 1000 * (2 ** Math.min(attempt, 5))) + Math.floor(Math.random() * 350);
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'kidsplay-primary-vocabulary-sync/1.0',
          accept: 'application/json'
        }
      });
      if (response.ok) return response.json();
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`${url}: HTTP ${response.status} ${response.statusText}`);
      }
      const delay = retryDelayMs(response, attempt);
      console.warn(`${url}: HTTP ${response.status}; retry ${attempt + 1}/${MAX_FETCH_ATTEMPTS} in ${delay} ms`);
      await sleep(delay);
      lastError = new Error(`${url}: HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === MAX_FETCH_ATTEMPTS - 1) break;
      const delay = Math.min(30_000, 1000 * (2 ** Math.min(attempt, 5)));
      console.warn(`${url}: ${lastError.message}; retry ${attempt + 1}/${MAX_FETCH_ATTEMPTS} in ${delay} ms`);
      await sleep(delay);
    }
  }
  throw lastError ?? new Error(`${url}: fetch failed`);
}

async function datasetRevision() {
  const info = await fetchJson(`https://huggingface.co/api/datasets/${DATASET_ID}`);
  const sha = cleanText(info.sha);
  if (!sha) throw new Error('Hugging Face dataset metadata did not return a revision SHA');
  return sha;
}

const rowsUrl = (offset, length) => {
  const params = new URLSearchParams({
    dataset: DATASET_ID,
    config: CONFIG,
    split: SPLIT,
    offset: String(offset),
    length: String(length)
  });
  return `https://datasets-server.huggingface.co/rows?${params}`;
};

async function fetchAllRows() {
  const first = await fetchJson(rowsUrl(0, PAGE_SIZE));
  const total = Number(first.num_rows_total);
  if (!Number.isInteger(total) || total < MIN_EXPECTED_ROWS) {
    throw new Error(`Unexpected source row count ${first.num_rows_total}; expected at least ${MIN_EXPECTED_ROWS}`);
  }

  const result = [...(first.rows ?? [])];
  for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
    await sleep(REQUEST_PACING_MS);
    const page = await fetchJson(rowsUrl(offset, Math.min(PAGE_SIZE, total - offset)));
    result.push(...(page.rows ?? []));
    if (offset % 1000 === 0) console.log(`Fetched ${Math.min(offset + PAGE_SIZE, total)}/${total} vocabulary rows`);
  }
  if (result.length !== total) throw new Error(`Fetched ${result.length} rows, expected ${total}`);
  return result.map((wrapper) => wrapper?.row ?? wrapper);
}

const summarize = (entries) => {
  const byGrade = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [String(index + 1), 0]));
  let withCefr = 0;
  let withYle = 0;
  let withCurriculumSource = 0;
  let withFrequency = 0;
  for (const entry of entries) {
    byGrade[String(entry.grade)] += 1;
    if (entry.gradeEvidence.cefrLevel) withCefr += 1;
    if (entry.gradeEvidence.yleLevel) withYle += 1;
    if (entry.gradeEvidence.tags.some((tag) => tag.startsWith('source:'))) withCurriculumSource += 1;
    if (entry.frequency.zipf !== null) withFrequency += 1;
  }
  return { total: entries.length, byGrade, withFrequency, withCefr, withYle, withCurriculumSource };
};

export async function buildPrimaryGradeCorpus() {
  // The Dataset Viewer rows API does not expose a revision selector. Capture the
  // repository revision immediately before and after the paged fetch and fail
  // rather than label a mixed/changed fetch with a single revision SHA.
  const revision = await datasetRevision();
  const sourceRows = await fetchAllRows();
  const revisionAfterFetch = await datasetRevision();
  if (revisionAfterFetch !== revision) {
    throw new Error(`Source revision changed during sync (${revision} -> ${revisionAfterFetch}); rerun against a stable upstream revision`);
  }

  const entries = sourceRows.map(compactRow).sort((left, right) =>
    left.grade - right.grade
      || left.lemma.localeCompare(right.lemma, 'en')
      || String(left.partOfSpeech).localeCompare(String(right.partOfSpeech), 'en')
      || left.id.localeCompare(right.id, 'en')
  );

  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`Duplicate source id ${entry.id}`);
    ids.add(entry.id);
  }

  return {
    schemaVersion: 1,
    id: 'lexicon.primary.english.grade-candidates.001',
    language: 'en',
    status: 'open_source_candidate_corpus',
    license: LICENSE,
    source: {
      id: 'grundwortschatz-voc-en',
      dataset: DATASET_ID,
      revision,
      config: CONFIG,
      split: SPLIT,
      homepage: `https://huggingface.co/datasets/${DATASET_ID}`
    },
    policy: {
      gradeMeaning: 'Primary-school grade estimate from the source dataset; it is a curation signal, not a CBSE/SOF alignment claim.',
      childFacingDefinitionIncluded: false,
      importedExamplesIncluded: false,
      runtimeDefault: false,
      reviewRequiredBeforeMeaningInstruction: true
    },
    summary: summarize(entries),
    entries
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = resolve(String(args.output || DEFAULT_OUTPUT));
  const corpus = await buildPrimaryGradeCorpus();
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(corpus, null, 2)}\n`, 'utf8');
  console.log(`Primary vocabulary corpus written: ${corpus.summary.total} entries -> ${outputPath}`);
  console.log(`Grade distribution: ${JSON.stringify(corpus.summary.byGrade)}`);
  console.log(`Source revision: ${corpus.source.revision}`);
}

if (import.meta.url === `file://${resolve(process.argv[1] ?? '')}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  });
}
