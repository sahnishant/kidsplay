import { describe, expect, it } from 'vitest';
import {
  validateLearnAboutNavigationState,
  validateLearnAboutTopic
} from '../src/experience/learnAboutContract';
import {
  assertUniqueResolvedClueAnswer,
  validateClueRecord
} from '../src/experience/clueContract';

const earthTopic = {
  schemaVersion: 1 as const,
  topicId: 'topic.space.earth',
  childTitle: 'Earth',
  archetype: 'celestial_system',
  rootConceptRefs: ['concept.earth'],
  sections: [
    {
      sectionId: 'topic.space.earth.what-it-is',
      childTitle: 'Meet Earth',
      knowledgeRefs: ['kr.space.earth.is-planet'],
      depthBands: ['d0_first_play', 'd1_preschool'],
      recipeFamilies: ['explore', 'did_you_know', 'guess']
    }
  ],
  relatedTopicIds: ['topic.space.moon']
};

const dogClue = {
  schemaVersion: 1 as const,
  clueSetId: 'clue.animal.dog.r0',
  mechanism: 'concept_clues',
  demandBand: 'r0',
  authority: 'canonical_semantic',
  readingRequired: false,
  answerSemanticRef: 'semantic.dog',
  candidateSemanticRefs: ['semantic.dog', 'semantic.cow'],
  clues: [
    {
      clueId: 'clue.animal.dog.r0.1',
      audioUtteranceId: 'clue.animal.dog.r0.1.audio',
      evidenceRefs: ['kr.animal.dog.sound.bark']
    }
  ],
  explanationRef: 'kr.animal.dog.sound.bark'
};

describe('Learn About topic contract', () => {
  it('accepts a topic as ordered canonical refs plus presentation metadata, not duplicated fact truth', () => {
    expect(validateLearnAboutTopic(earthTopic)).toMatchObject({
      topicId: 'topic.space.earth',
      archetype: 'celestial_system',
      rootConceptRefs: ['concept.earth']
    });
  });

  it('rejects embedded fact/answer/mastery authority from topic navigation data', () => {
    expect(() => validateLearnAboutTopic({
      ...earthTopic,
      facts: ['Earth is a planet']
    })).toThrow(/may reference canonical truth but not own it/);

    expect(() => validateLearnAboutTopic({
      ...earthTopic,
      sections: [{ ...earthTopic.sections[0], answer: 'Earth' }]
    })).toThrow(/may reference canonical truth but not own it/);
  });

  it('limits Learn About persistence to navigation/discovery/favourite state', () => {
    expect(validateLearnAboutNavigationState({
      schemaVersion: 1,
      lastTopicId: 'topic.space.earth',
      lastSectionId: 'topic.space.earth.what-it-is',
      visitedDiscoveryRefs: ['discovery.earth.planet'],
      favouriteTopicIds: ['topic.space.earth']
    })).toMatchObject({
      lastTopicId: 'topic.space.earth',
      favouriteTopicIds: ['topic.space.earth']
    });

    expect(() => validateLearnAboutNavigationState({
      schemaVersion: 1,
      visitedDiscoveryRefs: [],
      favouriteTopicIds: [],
      mastery: { earth: 'strong' }
    })).toThrow(/may not own mastery/);
  });
});

describe('shared Learn About Guess / Riddle clue contract', () => {
  it('accepts a zero-reading R0 semantic clue with two visual candidates and canonical evidence', () => {
    expect(validateClueRecord(dogClue)).toMatchObject({
      demandBand: 'r0',
      readingRequired: false,
      answerSemanticRef: 'semantic.dog'
    });
  });

  it('keeps R0/R1 zero-reading and capped at two starting candidates', () => {
    expect(() => validateClueRecord({ ...dogClue, readingRequired: true })).toThrow(/R0\/R1 clue play may not require reading/);
    expect(() => validateClueRecord({
      ...dogClue,
      candidateSemanticRefs: ['semantic.dog', 'semantic.cow', 'semantic.cat']
    })).toThrow(/at most two visual candidates/);
  });

  it('requires canonical evidence for semantic clues and reviewed authority for classic/wordplay/logic', () => {
    expect(() => validateClueRecord({
      ...dogClue,
      clues: [{ clueId: 'clue.animal.dog.r0.1', text: 'I can bark.' }]
    })).toThrow(/requires evidenceRefs/);

    expect(() => validateClueRecord({
      ...dogClue,
      mechanism: 'classic',
      demandBand: 'r3'
    })).toThrow(/classic clues require reviewed authored authority/);
  });

  it('requires language metadata and the R4 band for wordplay', () => {
    const wordplay = {
      schemaVersion: 1 as const,
      clueSetId: 'clue.wordplay.sample',
      mechanism: 'wordplay',
      demandBand: 'r4',
      authority: 'kidsplay_authored_reviewed',
      readingRequired: false,
      reviewedAnswerToken: 'sample-answer',
      candidateSemanticRefs: ['semantic.sample-a', 'semantic.sample-b'],
      clues: [{ clueId: 'clue.wordplay.sample.1', text: 'A reviewed wordplay clue.' }]
    };

    expect(() => validateClueRecord(wordplay)).toThrow(/wordplay requires explicit language metadata/);
    expect(validateClueRecord({ ...wordplay, language: 'en-IN' })).toMatchObject({
      mechanism: 'wordplay',
      demandBand: 'r4',
      language: 'en-IN'
    });
  });

  it('fails closed unless the complete semantic clue set identifies exactly one declared candidate', () => {
    const record = validateClueRecord(dogClue);
    expect(assertUniqueResolvedClueAnswer(record, [
      { semanticRef: 'semantic.dog', satisfiesAllClues: true },
      { semanticRef: 'semantic.cow', satisfiesAllClues: false }
    ])).toBe('semantic.dog');

    expect(() => assertUniqueResolvedClueAnswer(record, [
      { semanticRef: 'semantic.dog', satisfiesAllClues: true },
      { semanticRef: 'semantic.cow', satisfiesAllClues: true }
    ])).toThrow(/exactly one candidate/);

    expect(() => assertUniqueResolvedClueAnswer(record, [
      { semanticRef: 'semantic.dog', satisfiesAllClues: false },
      { semanticRef: 'semantic.cow', satisfiesAllClues: true }
    ])).toThrow(/does not match answerSemanticRef/);
  });
});
