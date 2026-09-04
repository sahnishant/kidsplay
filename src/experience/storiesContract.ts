import type { ChildAudioUtteranceManifest } from '../runtime/childAudioManifest';
import { resolveChildAudioUtterance } from '../runtime/childAudioManifest';

export type StoryDurationBand = 'tiny_tale' | 'bedtime_story' | 'big_story';
export type StoryReadingMode = 'read_to_me' | 'read_together' | 'i_can_read';
export type StoryEditorialStatus = 'draft' | 'reviewed';

export interface StoryWordTap {
  tokenId: string;
  displayText: string;
  pronunciationUtteranceId?: string;
  /**
   * Exact reviewed semantic authority only. No definition prose is stored here.
   * When absent, the token is pronunciation-only / no meaning expansion.
   */
  reviewedMeaning?: {
    senseRef: string;
    knowledgeRef: string;
  };
}

export interface StoryBeat {
  beatId: string;
  text: string;
  narrationUtteranceId?: string;
  sceneRef?: string;
  characterIds: readonly string[];
  tappableWords?: readonly StoryWordTap[];
}

export interface StoryManifest {
  schemaVersion: 1;
  storyId: string;
  childTitle: string;
  seriesId?: string;
  /** Human/editorial authority is explicit and separate from engineering validity. */
  editorialStatus: StoryEditorialStatus;
  lexicalProfileRef: string;
  durationBand: StoryDurationBand;
  supportedModes: readonly StoryReadingMode[];
  beats: readonly StoryBeat[];
  assessmentPolicy: 'none';
  masteryWritesAllowed: false;
}

export interface StoryReadingState {
  schemaVersion: 1;
  storyId: string;
  currentBeatId: string;
  completed: boolean;
  favourite: boolean;
}

const STABLE_REF = /^[a-z0-9]+(?:[._:#-][a-z0-9]+)*$/i;
const VALID_DURATIONS = new Set<StoryDurationBand>(['tiny_tale', 'bedtime_story', 'big_story']);
const VALID_MODES = new Set<StoryReadingMode>(['read_to_me', 'read_together', 'i_can_read']);
const VALID_EDITORIAL_STATUSES = new Set<StoryEditorialStatus>(['draft', 'reviewed']);
const FORBIDDEN_KEYS = new Set([
  'question',
  'questions',
  'answer',
  'answers',
  'correctOption',
  'correctOptionId',
  'score',
  'accuracy',
  'streak',
  'mastery',
  'rewardCurrency',
  'xp'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertStableRef(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim() || !STABLE_REF.test(value)) {
    throw new Error(`${context} must be a stable ref`);
  }
  return value;
}

function assertText(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${context} must be non-empty text`);
  return value.trim();
}

function rejectAssessmentAuthority(value: unknown, path = 'story'): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) => rejectAssessmentAuthority(child, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`${path}.${key} is forbidden: Stories may not own assessment/mastery/currency state`);
    }
    rejectAssessmentAuthority(child, `${path}.${key}`);
  }
}

function validateWordTap(value: unknown, context: string): StoryWordTap {
  if (!isRecord(value)) throw new Error(`${context} must be an object`);
  const tokenId = assertStableRef(value.tokenId, `${context}.tokenId`);
  const displayText = assertText(value.displayText, `${context}.displayText`);
  const pronunciationUtteranceId = value.pronunciationUtteranceId === undefined
    ? undefined
    : assertStableRef(value.pronunciationUtteranceId, `${context}.pronunciationUtteranceId`);

  let reviewedMeaning: StoryWordTap['reviewedMeaning'];
  if (value.reviewedMeaning !== undefined) {
    if (!isRecord(value.reviewedMeaning)) throw new Error(`${context}.reviewedMeaning must be an object`);
    reviewedMeaning = {
      senseRef: assertStableRef(value.reviewedMeaning.senseRef, `${context}.reviewedMeaning.senseRef`),
      knowledgeRef: assertStableRef(value.reviewedMeaning.knowledgeRef, `${context}.reviewedMeaning.knowledgeRef`)
    };
  }

  return {
    tokenId,
    displayText,
    ...(pronunciationUtteranceId ? { pronunciationUtteranceId } : {}),
    ...(reviewedMeaning ? { reviewedMeaning } : {})
  };
}

function validateBeat(value: unknown, index: number): StoryBeat {
  if (!isRecord(value)) throw new Error(`beats[${index}] must be an object`);
  const beatId = assertStableRef(value.beatId, `beats[${index}].beatId`);
  const text = assertText(value.text, `${beatId}.text`);
  const narrationUtteranceId = value.narrationUtteranceId === undefined
    ? undefined
    : assertStableRef(value.narrationUtteranceId, `${beatId}.narrationUtteranceId`);
  const sceneRef = value.sceneRef === undefined ? undefined : assertStableRef(value.sceneRef, `${beatId}.sceneRef`);

  if (!Array.isArray(value.characterIds)) throw new Error(`${beatId}.characterIds must be an array`);
  const characterIds = value.characterIds.map((characterId, characterIndex) =>
    assertStableRef(characterId, `${beatId}.characterIds[${characterIndex}]`)
  );
  if (new Set(characterIds).size !== characterIds.length) throw new Error(`${beatId}.characterIds contains duplicates`);

  let tappableWords: StoryWordTap[] | undefined;
  if (value.tappableWords !== undefined) {
    if (!Array.isArray(value.tappableWords)) throw new Error(`${beatId}.tappableWords must be an array`);
    tappableWords = value.tappableWords.map((word, wordIndex) => validateWordTap(word, `${beatId}.tappableWords[${wordIndex}]`));
    const tokenIds = tappableWords.map((word) => word.tokenId);
    if (new Set(tokenIds).size !== tokenIds.length) throw new Error(`${beatId}.tappableWords contains duplicate token ids`);
  }

  return {
    beatId,
    text,
    ...(narrationUtteranceId ? { narrationUtteranceId } : {}),
    ...(sceneRef ? { sceneRef } : {}),
    characterIds,
    ...(tappableWords ? { tappableWords } : {})
  };
}

export function validateStoryManifest(value: unknown): StoryManifest {
  rejectAssessmentAuthority(value);
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error('Story manifest must use schemaVersion 1');
  const storyId = assertStableRef(value.storyId, 'storyId');
  const childTitle = assertText(value.childTitle, `${storyId}.childTitle`);
  const seriesId = value.seriesId === undefined ? undefined : assertStableRef(value.seriesId, `${storyId}.seriesId`);
  if (typeof value.editorialStatus !== 'string' || !VALID_EDITORIAL_STATUSES.has(value.editorialStatus as StoryEditorialStatus)) {
    throw new Error(`${storyId}: editorialStatus must be draft or reviewed`);
  }
  const editorialStatus = value.editorialStatus as StoryEditorialStatus;
  const lexicalProfileRef = assertStableRef(value.lexicalProfileRef, `${storyId}.lexicalProfileRef`);
  if (typeof value.durationBand !== 'string' || !VALID_DURATIONS.has(value.durationBand as StoryDurationBand)) {
    throw new Error(`${storyId}: invalid duration band`);
  }
  if (!Array.isArray(value.supportedModes) || value.supportedModes.length === 0) {
    throw new Error(`${storyId}: supportedModes is required`);
  }
  const supportedModes = value.supportedModes.map((mode) => {
    if (typeof mode !== 'string' || !VALID_MODES.has(mode as StoryReadingMode)) throw new Error(`${storyId}: invalid reading mode`);
    return mode as StoryReadingMode;
  });
  if (new Set(supportedModes).size !== supportedModes.length) throw new Error(`${storyId}: duplicate reading modes`);
  if (!supportedModes.includes('read_to_me')) throw new Error(`${storyId}: preschool V1 must support read_to_me`);

  if (!Array.isArray(value.beats) || value.beats.length === 0) throw new Error(`${storyId}: beats[] is required`);
  const beats = value.beats.map(validateBeat);
  const beatIds = beats.map((beat) => beat.beatId);
  if (new Set(beatIds).size !== beatIds.length) throw new Error(`${storyId}: duplicate beat ids`);

  if (value.assessmentPolicy !== 'none') throw new Error(`${storyId}: assessmentPolicy must be none`);
  if (value.masteryWritesAllowed !== false) throw new Error(`${storyId}: masteryWritesAllowed must be false`);

  return {
    schemaVersion: 1,
    storyId,
    childTitle,
    ...(seriesId ? { seriesId } : {}),
    editorialStatus,
    lexicalProfileRef,
    durationBand: value.durationBand as StoryDurationBand,
    supportedModes,
    beats,
    assessmentPolicy: 'none',
    masteryWritesAllowed: false
  };
}

export function isStoryPublishable(manifest: StoryManifest): boolean {
  return validateStoryManifest(manifest).editorialStatus === 'reviewed';
}

export function validateStoryReadingState(value: unknown, manifest: StoryManifest): StoryReadingState {
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error('Story reading state must use schemaVersion 1');
  const allowed = new Set(['schemaVersion', 'storyId', 'currentBeatId', 'completed', 'favourite']);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`Story reading state may not own ${key}`);
  }

  const storyId = assertStableRef(value.storyId, 'storyId');
  if (storyId !== manifest.storyId) throw new Error(`Story reading state is for ${storyId}, expected ${manifest.storyId}`);
  const currentBeatId = assertStableRef(value.currentBeatId, 'currentBeatId');
  if (!manifest.beats.some((beat) => beat.beatId === currentBeatId)) throw new Error(`Unknown story beat ${currentBeatId}`);
  if (typeof value.completed !== 'boolean' || typeof value.favourite !== 'boolean') {
    throw new Error('Story reading state requires boolean completed/favourite');
  }

  return { schemaVersion: 1, storyId, currentBeatId, completed: value.completed, favourite: value.favourite };
}

export function validateStoryNarrationCoverage(
  manifest: StoryManifest,
  audioManifest: ChildAudioUtteranceManifest
): void {
  for (const beat of manifest.beats) {
    if (!beat.narrationUtteranceId) continue;
    const utterance = resolveChildAudioUtterance(audioManifest, beat.narrationUtteranceId);
    if (!utterance) throw new Error(`${manifest.storyId}/${beat.beatId}: missing narration utterance ${beat.narrationUtteranceId}`);
    if (utterance.usage !== 'story_beat') {
      throw new Error(`${manifest.storyId}/${beat.beatId}: narration utterance must use story_beat usage`);
    }
  }

  for (const beat of manifest.beats) {
    for (const word of beat.tappableWords ?? []) {
      if (!word.pronunciationUtteranceId) continue;
      const utterance = resolveChildAudioUtterance(audioManifest, word.pronunciationUtteranceId);
      if (!utterance) throw new Error(`${manifest.storyId}/${word.tokenId}: missing pronunciation utterance`);
      if (utterance.usage !== 'vocabulary') {
        throw new Error(`${manifest.storyId}/${word.tokenId}: pronunciation must use vocabulary utterance usage`);
      }
    }
  }
}
