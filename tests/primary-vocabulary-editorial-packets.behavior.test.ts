import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildEditorialPacket } from '../scripts/lexicon/prepare-primary-vocabulary-editorial-packet.mjs';
import { finalizeEditorialPacket } from '../scripts/lexicon/finalize-primary-vocabulary-editorial-packet.mjs';

const curatorSlice = {
  schemaVersion: 1,
  kind: 'primary_vocabulary_curator_sense_slice',
  language: 'en',
  grade: 1,
  generatedFrom: {
    wordlistId: 'vocabulary.primary.grade1.introduced.meaning.review',
    sourceId: 'open-english-wordnet',
    sourceVersion: '2025',
    license: 'CC-BY-4.0'
  },
  policy: {
    importedGlossRuntimeAllowed: false,
    explicitHumanDecisionRequired: true,
    kidsplayChildDefinitionRequiredForAccept: true
  },
  items: [
    {
      lemma: 'full',
      grade: 1,
      partOfSpeech: 'adjective',
      priorityScore: 47.08,
      candidateSenses: [
        {
          candidateId: 'full#a#1',
          partOfSpeech: 'a',
          sourceSense: {
            senseId: 'full%3:00:00::',
            synsetId: '01086845-a',
            definition: 'containing as much or as many as is possible or normal',
            examples: ['a full glass'],
            synonyms: []
          },
          provenance: {
            sourceId: 'open-english-wordnet',
            sourceVersion: '2025',
            license: 'CC-BY-4.0',
            importedFieldPolicy: 'reference_candidate_only'
          }
        }
      ]
    },
    {
      lemma: 'old',
      grade: 1,
      partOfSpeech: 'adjective',
      priorityScore: 47.5,
      candidateSenses: [
        {
          candidateId: 'old#a#2',
          partOfSpeech: 'a',
          sourceSense: {
            senseId: 'old%3:00:02::',
            synsetId: '01648062-a',
            definition: 'having lived for a relatively long time or attained a specific age',
            examples: ['his mother is very old'],
            synonyms: []
          },
          provenance: {
            sourceId: 'open-english-wordnet',
            sourceVersion: '2025',
            license: 'CC-BY-4.0',
            importedFieldPolicy: 'reference_candidate_only'
          }
        }
      ]
    }
  ]
};

function loadRealSlice(grade: number) {
  return JSON.parse(readFileSync(resolve(`content/lexicon/open/curator-slices/grade-${grade}-meaning-review.json`), 'utf8'));
}

describe('primary vocabulary editorial production packets', () => {
  it('prepares a prioritized fail-closed packet without treating AI drafts or grade signals as review', () => {
    const packet = buildEditorialPacket(curatorSlice, {
      batchId: 'grade-1-batch-001',
      profileReviewTargets: ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1']
    });

    expect(packet.items.map((item) => item.lemma)).toEqual(['old', 'full']);
    expect(packet.policy).toMatchObject({
      publicationState: 'blocked_pending_editorial_review',
      importedGlossRuntimeAllowed: false,
      aiDraftAllowed: true,
      aiDraftMayCountAsReviewed: false,
      requiredReviewAuthority: 'human_editor',
      explicitReviewerRequiredForAcceptance: true,
      profilePlacementRequiresExplicitApproval: true,
      corpusGradeMayImplyBoardAlignment: false
    });
    expect(packet.profileReviewTargets).toEqual(['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1']);
    expect(packet.items[0].candidateSenses[0]).toMatchObject({
      candidateId: 'old#a#2',
      referenceOnly: true
    });
    expect(packet.items[0].editorial).toMatchObject({
      status: 'draft',
      decision: null,
      selectedCandidateId: null,
      draftChildDefinition: null,
      draftOrigin: null,
      reviewAuthority: null,
      reviewer: null,
      reviewedAt: null
    });
    expect(packet.items[0].profilePlacement).toEqual({
      status: 'unreviewed',
      approvedProfileRefs: [],
      notes: null,
      reviewAuthority: null,
      reviewer: null,
      reviewedAt: null
    });
  });

  it('prepares the real prioritized Grade 1 and Grade 2 curator batches without pre-approving anything', () => {
    const grade1 = buildEditorialPacket(loadRealSlice(1), {
      batchId: 'grade-1-batch-001',
      profileReviewTargets: ['CBSE_INDIA_CLASS1', 'CISCE_INDIA_CLASS1']
    });
    const grade2 = buildEditorialPacket(loadRealSlice(2), {
      batchId: 'grade-2-batch-001',
      profileReviewTargets: ['CBSE_INDIA_CLASS2', 'CISCE_INDIA_CLASS2', 'SOF_INDIA_CLASS2']
    });

    for (const packet of [grade1, grade2]) {
      expect(packet.summary.words).toBe(40);
      expect(packet.summary.candidateSenses).toBeGreaterThanOrEqual(40);
      expect(new Set(packet.items.map((item) => item.lemma)).size).toBe(40);
      expect(packet.items.every((item) => item.candidateSenses.length > 0)).toBe(true);
      expect(packet.items.every((item) => item.editorial.status === 'draft')).toBe(true);
      expect(packet.items.every((item) => item.editorial.reviewAuthority === null)).toBe(true);
      expect(packet.items.every((item) => item.profilePlacement.approvedProfileRefs.length === 0)).toBe(true);
      expect(packet.items.every((item) => item.candidateSenses.every((candidate) => candidate.referenceOnly === true))).toBe(true);
    }
  });

  it('finalizes only explicitly human-reviewed decisions and keeps profile placement separate', () => {
    const packet = buildEditorialPacket(curatorSlice, {
      batchId: 'grade-1-batch-001',
      profileReviewTargets: ['CBSE_INDIA_CLASS1']
    });
    packet.items[0].editorial = {
      status: 'reviewed',
      decision: 'accept',
      selectedCandidateId: 'old#a#2',
      draftChildDefinition: 'Someone or something that has been around for a long time.',
      draftChildExample: 'My grandmother has an old photo album.',
      draftOrigin: 'ai_draft_human_rewritten',
      notes: 'Age/duration sense selected for primary use.',
      reviewAuthority: 'human_editor',
      reviewer: 'editor-a',
      reviewedAt: '2026-08-31'
    };
    packet.items[0].profilePlacement = {
      status: 'reviewed',
      approvedProfileRefs: ['CBSE_INDIA_CLASS1'],
      notes: 'Explicitly approved for Class 1 review placement.',
      reviewAuthority: 'human_editor',
      reviewer: 'editor-a',
      reviewedAt: '2026-08-31'
    };

    const handoff = finalizeEditorialPacket(packet);
    expect(handoff.summary).toEqual({
      packetWords: 2,
      reviewedDecisions: 1,
      accepted: 1,
      rejected: 0,
      reviewedProfilePlacements: 1
    });
    expect(handoff.decisions).toEqual([
      expect.objectContaining({
        lemma: 'old',
        candidateId: 'old#a#2',
        status: 'reviewed',
        decision: 'accept',
        reviewAuthority: 'human_editor',
        childDefinition: 'Someone or something that has been around for a long time.',
        reviewer: 'editor-a',
        reviewedAt: '2026-08-31'
      })
    ]);
    expect(handoff.profilePlacements).toEqual([
      expect.objectContaining({
        lemma: 'old',
        approvedProfileRefs: ['CBSE_INDIA_CLASS1'],
        reviewAuthority: 'human_editor',
        reviewer: 'editor-a'
      })
    ]);
    expect(handoff.decisions.some((decision) => decision.lemma === 'full')).toBe(false);
  });

  it('rejects copied glosses, unknown candidates, missing reviewers and non-human review authority', () => {
    const copied = buildEditorialPacket(curatorSlice);
    copied.items[0].editorial = {
      status: 'reviewed',
      decision: 'accept',
      selectedCandidateId: 'old#a#2',
      draftChildDefinition: 'having lived for a relatively long time or attained a specific age',
      draftChildExample: null,
      draftOrigin: 'human',
      notes: null,
      reviewAuthority: 'human_editor',
      reviewer: 'editor-a',
      reviewedAt: '2026-08-31'
    };
    expect(() => finalizeEditorialPacket(copied)).toThrow(/must not copy the OEWN gloss verbatim/);

    const unknown = buildEditorialPacket(curatorSlice);
    unknown.items[0].editorial = {
      status: 'reviewed',
      decision: 'accept',
      selectedCandidateId: 'old#a#999',
      draftChildDefinition: 'A child-safe original definition.',
      draftChildExample: null,
      draftOrigin: 'human',
      notes: null,
      reviewAuthority: 'human_editor',
      reviewer: 'editor-a',
      reviewedAt: '2026-08-31'
    };
    expect(() => finalizeEditorialPacket(unknown)).toThrow(/selected candidateId from the packet/);

    const missingReviewer = buildEditorialPacket(curatorSlice);
    missingReviewer.items[0].editorial = {
      status: 'reviewed',
      decision: 'reject',
      selectedCandidateId: 'old#a#2',
      draftChildDefinition: null,
      draftChildExample: null,
      draftOrigin: 'human',
      notes: null,
      reviewAuthority: 'human_editor',
      reviewer: null,
      reviewedAt: null
    };
    expect(() => finalizeEditorialPacket(missingReviewer)).toThrow(/requires reviewer and ISO reviewedAt/);

    const aiOnly = buildEditorialPacket(curatorSlice);
    aiOnly.items[0].editorial = {
      status: 'reviewed',
      decision: 'accept',
      selectedCandidateId: 'old#a#2',
      draftChildDefinition: 'A child-safe original definition.',
      draftChildExample: null,
      draftOrigin: 'ai',
      notes: null,
      reviewAuthority: 'ai',
      reviewer: 'automation',
      reviewedAt: '2026-08-31'
    };
    expect(() => finalizeEditorialPacket(aiOnly)).toThrow(/requires human_editor reviewAuthority/);
  });
});
