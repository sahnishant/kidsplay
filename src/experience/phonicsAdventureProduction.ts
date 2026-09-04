import type {
  BaseQuestion,
  DragToTargetQuestion,
  Question,
  SingleChoiceQuestion
} from '../contracts/question';
import type { DiscoveryEntry } from './discoveryProjection';
import { projectDiscoveries } from './discoveryProjection';
import {
  validatePhonemeGraphemeMapping,
  type PhonemeGraphemeMapping
} from './phonemeGraphemeContract';
import { buildPhonicsProgression, type PhonicsProgressionStage } from './phonicsProgression';
import type { ProgressSnapshot } from '../runtime/localProgress';

export const SOUND_TRAIL_ADVENTURE_ID = 'phonics.sound-trail.v1';
export const SOUND_TRAIL_TITLE = 'Scientu’s Sound Trail';

export type SoundTrailStage = Extract<
  PhonicsProgressionStage,
  'discriminate' | 'connect_object_word' | 'grapheme' | 'recognition'
>;

export interface SoundTrailAudioCue {
  mappingId: string;
  phonemeId: string;
  stage: SoundTrailStage;
  bundledSrc: string;
  audioUtteranceId: string;
  audioReview: 'approved_existing_pack' | 'candidate_pending_human';
}

interface SoundDefinition {
  mapping: PhonemeGraphemeMapping;
  word: string;
  visualRef: string;
  bundledSrc: string;
  audioReview: SoundTrailAudioCue['audioReview'];
}

type SoundTrailQuestionBase = Omit<BaseQuestion, 'prompt' | 'feedback'>;

const definitions: readonly SoundDefinition[] = [
  {
    mapping: validatePhonemeGraphemeMapping({
      schemaVersion: 1,
      mappingId: 'phonics.en-in.m.initial',
      language: 'en',
      locale: 'en-IN',
      phonemeId: 'phoneme.en.m',
      grapheme: 'm',
      phonemeAudioUtteranceId: 'prereader.phoneme.m',
      examples: [{
        knowledgeRef: 'kr.phonics.en-in.m.initial.milk',
        semanticRef: 'entity.food.milk',
        position: 'initial'
      }],
      authority: 'kidsplay_authored_validated',
      reviewerRef: 'review.phonics.en-in.sound-trail-v1',
      reviewedAt: '2026-09-04'
    }),
    word: 'Milk',
    visualRef: 'entity.food.milk',
    bundledSrc: '/audio/kidsplay-v1/prereader/phoneme-m.ogg',
    audioReview: 'approved_existing_pack'
  },
  {
    mapping: validatePhonemeGraphemeMapping({
      schemaVersion: 1,
      mappingId: 'phonics.en-in.f.initial',
      language: 'en',
      locale: 'en-IN',
      phonemeId: 'phoneme.en.f',
      grapheme: 'f',
      phonemeAudioUtteranceId: 'prereader.phoneme.f',
      examples: [{
        knowledgeRef: 'kr.phonics.en-in.f.initial.fish',
        semanticRef: 'entity.animal.fish',
        position: 'initial'
      }],
      authority: 'kidsplay_authored_validated',
      reviewerRef: 'review.phonics.en-in.sound-trail-v1',
      reviewedAt: '2026-09-04'
    }),
    word: 'Fish',
    visualRef: 'entity.animal.fish',
    bundledSrc: '/audio/kidsplay-v1/prereader/phoneme-f.ogg',
    audioReview: 'candidate_pending_human'
  },
  {
    mapping: validatePhonemeGraphemeMapping({
      schemaVersion: 1,
      mappingId: 'phonics.en-in.s.initial',
      language: 'en',
      locale: 'en-IN',
      phonemeId: 'phoneme.en.s',
      grapheme: 's',
      phonemeAudioUtteranceId: 'prereader.phoneme.s',
      examples: [{
        knowledgeRef: 'kr.phonics.en-in.s.initial.sun',
        semanticRef: 'entity.nature.sun',
        position: 'initial'
      }],
      authority: 'kidsplay_authored_validated',
      reviewerRef: 'review.phonics.en-in.sound-trail-v1',
      reviewedAt: '2026-09-04'
    }),
    word: 'Sun',
    visualRef: 'entity.nature.sun',
    bundledSrc: '/audio/kidsplay-v1/prereader/phoneme-s.ogg',
    audioReview: 'candidate_pending_human'
  }
] as const;

const orderedMappingIds = definitions.map((item) => item.mapping.mappingId);
const progression = buildPhonicsProgression(definitions.map((item) => item.mapping), orderedMappingIds, 'en-IN');

function otherDefinitions(mappingId: string): SoundDefinition[] {
  return definitions.filter((item) => item.mapping.mappingId !== mappingId);
}

function visualOption(item: SoundDefinition) {
  return {
    id: item.mapping.grapheme,
    label: item.word,
    semanticRef: item.mapping.examples[0].semanticRef,
    visualRefs: [item.visualRef]
  };
}

function baseQuestion(item: SoundDefinition, stage: SoundTrailStage): SoundTrailQuestionBase {
  return {
    id: `phonics.sound-trail.${item.mapping.grapheme}.${stage}.001`,
    revision: 1,
    schemaVersion: 1,
    conceptIds: [item.mapping.phonemeId],
    knowledgeRefs: [item.mapping.examples[0].knowledgeRef],
    gradeBands: [1],
    difficulty: stage === 'discriminate' || stage === 'connect_object_word' ? 1 : 2,
    language: 'en',
    authoring: { status: 'reviewed', source: 'kidsplay-phonics-v1' }
  };
}

function discriminateQuestion(item: SoundDefinition): SingleChoiceQuestion {
  const contrast = otherDefinitions(item.mapping.mappingId)[0];
  return {
    ...baseQuestion(item, 'discriminate'),
    prompt: { text: 'Listen first. Tap the picture that begins with the sound.' },
    interaction: {
      type: 'single_choice', version: 1, shuffleOptions: true,
      options: [visualOption(item), visualOption(contrast)]
    },
    solution: { type: 'exact_option', correctOptionIds: [item.mapping.grapheme] },
    feedback: {
      correct: `Yes. ${item.word} begins with that sound.`,
      incorrect: 'Listen again. Then look for the picture whose name starts the same way.'
    }
  };
}

function connectQuestion(item: SoundDefinition): DragToTargetQuestion {
  const contrast = otherDefinitions(item.mapping.mappingId)[1];
  return {
    ...baseQuestion(item, 'connect_object_word'),
    prompt: { text: 'Listen again. Sort the pictures by whether they begin with this sound.' },
    interaction: {
      type: 'drag_to_target',
      version: 1,
      items: [
        { id: item.mapping.grapheme, label: item.word, visualRefs: [item.visualRef] },
        { id: contrast.mapping.grapheme, label: contrast.word, visualRefs: [contrast.visualRef] }
      ],
      targets: [
        { id: 'same', label: 'Same starting sound', symbol: '👂' },
        { id: 'different', label: 'Different starting sound', symbol: '↔' }
      ]
    },
    solution: {
      type: 'target_assignment',
      assignments: { [item.mapping.grapheme]: 'same', [contrast.mapping.grapheme]: 'different' }
    },
    feedback: {
      correct: `Yes. ${item.word} starts with the sound you heard.`,
      incorrect: 'Use Repeat. Say each picture name slowly and listen to the first sound.'
    }
  };
}

function graphemeQuestion(item: SoundDefinition): SingleChoiceQuestion {
  const others = otherDefinitions(item.mapping.mappingId);
  return {
    ...baseQuestion(item, 'grapheme'),
    prompt: { text: 'Now tap the letter that writes the sound you heard.' },
    interaction: {
      type: 'single_choice', version: 1, shuffleOptions: true,
      options: [item, ...others].map((entry) => ({
        id: entry.mapping.grapheme,
        label: entry.mapping.grapheme.toUpperCase()
      }))
    },
    solution: { type: 'exact_option', correctOptionIds: [item.mapping.grapheme] },
    feedback: {
      correct: `That sound can be written with ${item.mapping.grapheme.toUpperCase()}.`,
      incorrect: 'Use Repeat. Listen to the sound before choosing the letter.'
    }
  };
}

function recognitionQuestion(item: SoundDefinition): SingleChoiceQuestion {
  const others = otherDefinitions(item.mapping.mappingId);
  return {
    ...baseQuestion(item, 'recognition'),
    prompt: { text: 'Find the word and picture that start with the sound you heard.' },
    interaction: {
      type: 'single_choice', version: 1, shuffleOptions: true,
      options: [visualOption(item), ...others.map(visualOption)]
    },
    solution: { type: 'exact_option', correctOptionIds: [item.mapping.grapheme] },
    feedback: {
      correct: `You found ${item.word}. Sound, letter and word match.`,
      incorrect: 'Listen again, then say the picture names slowly.'
    }
  };
}

const stages: readonly SoundTrailStage[] = [
  'discriminate',
  'connect_object_word',
  'grapheme',
  'recognition'
];

const questions: Question[] = definitions.flatMap((item) => [
  discriminateQuestion(item),
  connectQuestion(item),
  graphemeQuestion(item),
  recognitionQuestion(item)
]);

const cueByQuestionId = new Map<string, SoundTrailAudioCue>();
for (const item of definitions) {
  for (const stage of stages) {
    cueByQuestionId.set(`phonics.sound-trail.${item.mapping.grapheme}.${stage}.001`, {
      mappingId: item.mapping.mappingId,
      phonemeId: item.mapping.phonemeId,
      stage,
      bundledSrc: item.bundledSrc,
      audioUtteranceId: item.mapping.phonemeAudioUtteranceId,
      audioReview: item.audioReview
    });
  }
}

export function getSoundTrailMappings(): PhonemeGraphemeMapping[] {
  return definitions.map((item) => validatePhonemeGraphemeMapping(item.mapping));
}

export function getSoundTrailProgression() {
  return progression.map((item) => ({ ...item, stages: [...item.stages] }));
}

export function getSoundTrailQuestions(): Question[] {
  return questions.map((question) => structuredClone(question));
}

export function resolveSoundTrailAudioCue(questionId: string): SoundTrailAudioCue | null {
  const cue = cueByQuestionId.get(questionId);
  return cue ? { ...cue } : null;
}

export function isSoundTrailQuestion(question: Question): boolean {
  return question.authoring.source === 'kidsplay-phonics-v1' && cueByQuestionId.has(question.id);
}

export function projectSoundTrailDiscovery(progress: ProgressSnapshot): DiscoveryEntry[] {
  const completedRecognition = new Set(
    progress.attempts
      .filter((attempt) => attempt.correct && attempt.questionId.endsWith('.recognition.001'))
      .map((attempt) => resolveSoundTrailAudioCue(attempt.questionId)?.phonemeId)
      .filter((value): value is string => Boolean(value))
  );
  const complete = definitions.every((item) => completedRecognition.has(item.mapping.phonemeId));

  return projectDiscoveries(
    [{
      ruleId: 'discovery.rule.phonics.sound-trail-v1',
      sourceEventRef: 'event.phonics.sound-trail-v1.complete',
      discoveryId: 'discovery.phonics.sound-trail-v1',
      kind: 'vocabulary_semantic',
      canonicalRefs: progression.map((item) => item.phonemeId),
      foundAtRef: SOUND_TRAIL_ADVENTURE_ID
    }],
    complete ? ['event.phonics.sound-trail-v1.complete'] : []
  );
}

export function soundTrailAudioReviewPending(): string[] {
  return definitions
    .filter((item) => item.audioReview === 'candidate_pending_human')
    .map((item) => item.mapping.phonemeAudioUtteranceId);
}
