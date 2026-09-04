export type ClueMechanism =
  | 'concept_clues'
  | 'progressive_clues'
  | 'inference'
  | 'classic'
  | 'wordplay'
  | 'logic';

export type ClueDemandBand = 'r0' | 'r1' | 'r2' | 'r3' | 'r4' | 'r5';

export type ClueAuthority = 'canonical_semantic' | 'kidsplay_authored_reviewed';

export interface ClueBeat {
  clueId: string;
  text?: string;
  audioUtteranceId?: string;
  /** Canonical refs supporting a semantic clue. Empty only for reviewed authored classic/wordplay/logic clues. */
  evidenceRefs?: readonly string[];
}

export interface ClueRecord {
  schemaVersion: 1;
  clueSetId: string;
  mechanism: ClueMechanism;
  demandBand: ClueDemandBand;
  authority: ClueAuthority;
  readingRequired: boolean;
  language?: string;
  answerSemanticRef?: string;
  reviewedAnswerToken?: string;
  candidateSemanticRefs: readonly string[];
  clues: readonly ClueBeat[];
  explanationRef?: string;
}

export interface ResolvedClueCandidate {
  semanticRef: string;
  /** Derived upstream from the complete clue set and canonical semantic knowledge. */
  satisfiesAllClues: boolean;
}

const VALID_MECHANISMS = new Set<ClueMechanism>([
  'concept_clues',
  'progressive_clues',
  'inference',
  'classic',
  'wordplay',
  'logic'
]);
const VALID_BANDS = new Set<ClueDemandBand>(['r0', 'r1', 'r2', 'r3', 'r4', 'r5']);
const VALID_AUTHORITIES = new Set<ClueAuthority>(['canonical_semantic', 'kidsplay_authored_reviewed']);
const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;

function assertStableRef(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || !STABLE_REF.test(value)) {
    throw new Error(`${context} must be a stable ref`);
  }
  return value;
}

function assertLanguage(value: unknown, context: string): string {
  if (typeof value !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value)) {
    throw new Error(`${context} must be a language tag`);
  }
  return value;
}

function validateClueBeat(value: unknown, index: number): ClueBeat {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`clues[${index}] must be an object`);
  const raw = value as Record<string, unknown>;
  const clueId = assertStableRef(raw.clueId, `clues[${index}].clueId`);
  const text = raw.text === undefined ? undefined : String(raw.text).trim();
  const audioUtteranceId = raw.audioUtteranceId === undefined
    ? undefined
    : assertStableRef(raw.audioUtteranceId, `${clueId}.audioUtteranceId`);
  if (!text && !audioUtteranceId) throw new Error(`${clueId}: clue needs text and/or an audio utterance id`);

  let evidenceRefs: string[] | undefined;
  if (raw.evidenceRefs !== undefined) {
    if (!Array.isArray(raw.evidenceRefs)) throw new Error(`${clueId}.evidenceRefs must be an array`);
    evidenceRefs = raw.evidenceRefs.map((item, evidenceIndex) => assertStableRef(item, `${clueId}.evidenceRefs[${evidenceIndex}]`));
    if (new Set(evidenceRefs).size !== evidenceRefs.length) throw new Error(`${clueId}.evidenceRefs contains duplicates`);
  }

  return {
    clueId,
    ...(text ? { text } : {}),
    ...(audioUtteranceId ? { audioUtteranceId } : {}),
    ...(evidenceRefs ? { evidenceRefs } : {})
  };
}

export function validateClueRecord(value: unknown): ClueRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Clue record must be an object');
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== 1) throw new Error('Clue record must use schemaVersion 1');

  const clueSetId = assertStableRef(raw.clueSetId, 'clueSetId');
  if (typeof raw.mechanism !== 'string' || !VALID_MECHANISMS.has(raw.mechanism as ClueMechanism)) {
    throw new Error(`${clueSetId}: invalid mechanism`);
  }
  if (typeof raw.demandBand !== 'string' || !VALID_BANDS.has(raw.demandBand as ClueDemandBand)) {
    throw new Error(`${clueSetId}: invalid demand band`);
  }
  if (typeof raw.authority !== 'string' || !VALID_AUTHORITIES.has(raw.authority as ClueAuthority)) {
    throw new Error(`${clueSetId}: invalid authority`);
  }
  if (typeof raw.readingRequired !== 'boolean') throw new Error(`${clueSetId}: readingRequired must be boolean`);

  const mechanism = raw.mechanism as ClueMechanism;
  const demandBand = raw.demandBand as ClueDemandBand;
  const authority = raw.authority as ClueAuthority;
  const readingRequired = raw.readingRequired;

  if ((demandBand === 'r0' || demandBand === 'r1') && readingRequired) {
    throw new Error(`${clueSetId}: R0/R1 clue play may not require reading`);
  }
  if (mechanism === 'wordplay' && demandBand !== 'r4') {
    throw new Error(`${clueSetId}: wordplay must use the R4 demand band`);
  }
  if (mechanism === 'logic' && demandBand !== 'r5') {
    throw new Error(`${clueSetId}: logic/trick riddles must use the R5 demand band`);
  }

  let language: string | undefined;
  if (raw.language !== undefined) language = assertLanguage(raw.language, `${clueSetId}.language`);
  if (mechanism === 'wordplay' && !language) throw new Error(`${clueSetId}: wordplay requires explicit language metadata`);

  const answerSemanticRef = raw.answerSemanticRef === undefined
    ? undefined
    : assertStableRef(raw.answerSemanticRef, `${clueSetId}.answerSemanticRef`);
  const reviewedAnswerToken = raw.reviewedAnswerToken === undefined ? undefined : String(raw.reviewedAnswerToken).trim();
  if (Boolean(answerSemanticRef) === Boolean(reviewedAnswerToken)) {
    throw new Error(`${clueSetId}: provide exactly one answer authority: semantic ref or reviewed answer token`);
  }
  if (authority === 'canonical_semantic' && !answerSemanticRef) {
    throw new Error(`${clueSetId}: canonical semantic clues require answerSemanticRef`);
  }
  if (authority === 'kidsplay_authored_reviewed' && !reviewedAnswerToken && !answerSemanticRef) {
    throw new Error(`${clueSetId}: reviewed authored clue requires a reviewed answer`);
  }

  if (!Array.isArray(raw.candidateSemanticRefs) || raw.candidateSemanticRefs.length < 2) {
    throw new Error(`${clueSetId}: candidateSemanticRefs requires at least two candidates`);
  }
  const candidateSemanticRefs = raw.candidateSemanticRefs.map((item, index) =>
    assertStableRef(item, `${clueSetId}.candidateSemanticRefs[${index}]`)
  );
  if (new Set(candidateSemanticRefs).size !== candidateSemanticRefs.length) {
    throw new Error(`${clueSetId}: duplicate candidate semantic refs`);
  }
  if ((demandBand === 'r0' || demandBand === 'r1') && candidateSemanticRefs.length > 2) {
    throw new Error(`${clueSetId}: R0/R1 starts with at most two visual candidates`);
  }
  if (answerSemanticRef && !candidateSemanticRefs.includes(answerSemanticRef)) {
    throw new Error(`${clueSetId}: candidate set must include answerSemanticRef`);
  }

  if (!Array.isArray(raw.clues) || raw.clues.length === 0) throw new Error(`${clueSetId}: clues[] is required`);
  const clues = raw.clues.map(validateClueBeat);
  const clueIds = clues.map((clue) => clue.clueId);
  if (new Set(clueIds).size !== clueIds.length) throw new Error(`${clueSetId}: duplicate clue ids`);

  if (authority === 'canonical_semantic') {
    for (const clue of clues) {
      if (!clue.evidenceRefs?.length) throw new Error(`${clueSetId}/${clue.clueId}: canonical semantic clue requires evidenceRefs`);
    }
  }
  if (['classic', 'wordplay', 'logic'].includes(mechanism) && authority !== 'kidsplay_authored_reviewed') {
    throw new Error(`${clueSetId}: ${mechanism} clues require reviewed authored authority`);
  }

  const explanationRef = raw.explanationRef === undefined
    ? undefined
    : assertStableRef(raw.explanationRef, `${clueSetId}.explanationRef`);

  return {
    schemaVersion: 1,
    clueSetId,
    mechanism,
    demandBand,
    authority,
    readingRequired,
    ...(language ? { language } : {}),
    ...(answerSemanticRef ? { answerSemanticRef } : {}),
    ...(reviewedAnswerToken ? { reviewedAnswerToken } : {}),
    candidateSemanticRefs,
    clues,
    ...(explanationRef ? { explanationRef } : {})
  };
}

/**
 * Fail-closed uniqueness check after a canonical semantic resolver evaluates
 * the complete clue set over the declared candidates.
 */
export function assertUniqueResolvedClueAnswer(
  record: ClueRecord,
  resolvedCandidates: readonly ResolvedClueCandidate[]
): string {
  const declared = new Set(record.candidateSemanticRefs);
  if (resolvedCandidates.length !== declared.size) {
    throw new Error(`${record.clueSetId}: resolved candidate count must match declared candidate set`);
  }
  const seen = new Set<string>();
  for (const candidate of resolvedCandidates) {
    if (!declared.has(candidate.semanticRef)) throw new Error(`${record.clueSetId}: unexpected resolved candidate ${candidate.semanticRef}`);
    if (seen.has(candidate.semanticRef)) throw new Error(`${record.clueSetId}: duplicate resolved candidate ${candidate.semanticRef}`);
    seen.add(candidate.semanticRef);
  }

  const matches = resolvedCandidates.filter((candidate) => candidate.satisfiesAllClues);
  if (matches.length !== 1) {
    throw new Error(`${record.clueSetId}: full clue set must identify exactly one candidate; got ${matches.length}`);
  }
  if (record.answerSemanticRef && matches[0].semanticRef !== record.answerSemanticRef) {
    throw new Error(`${record.clueSetId}: resolved unique candidate does not match answerSemanticRef`);
  }
  return matches[0].semanticRef;
}
