import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readJson = <T>(path: string): T => JSON.parse(
  readFileSync(resolve(process.cwd(), path), 'utf8')
) as T;

describe('Bicycle Workshop chapter-check blueprint', () => {
  const blueprint = readJson<any>('content/module-assessments/bicycle-workshop-chapter-check.json');
  const pack = readJson<any>('content/packs/free-bicycle-workshop-chapter-check.json');

  it('defines a contiguous eight-mark formative check without an official-paper claim', () => {
    expect(blueprint).toMatchObject({
      blueprintId: 'assessment.bicycle-workshop.chapter-check.v1',
      packRef: pack.id,
      assessmentKind: 'formative_chapter_check',
      officialPaperClaimed: false,
      sourcePassageReproduced: false,
      sourceExerciseWordingReproduced: false,
      totalQuestions: 8,
      totalMarks: 8
    });

    expect(blueprint.sections.reduce((sum: number, section: any) => sum + section.count, 0)).toBe(8);
    expect(blueprint.sections.reduce((sum: number, section: any) => sum + section.count * section.marksPerQuestion, 0)).toBe(8);
    expect(blueprint.sections.every((section: any, index: number) => (
      section.startIndex === blueprint.sections.slice(0, index).reduce((sum: number, prior: any) => sum + prior.count, 0)
    ))).toBe(true);
  });

  it('uses exactly the fixed question set admitted by the pack', () => {
    const blueprintRefs = blueprint.sections.flatMap((section: any) => section.questionRefs);
    expect(blueprint.selectionPolicy).toMatchObject({
      type: 'fixed_question_set',
      shuffleQuestions: false,
      runtimeCloudGeneration: false
    });
    expect(blueprintRefs).toEqual(pack.questionRefs);
    expect(new Set(blueprintRefs).size).toBe(8);
    expect(pack.assessmentScope.blueprintRef).toBe(blueprint.blueprintId);
  });

  it('prevents reading, phonics and grammar items from granting bicycle fact mastery', () => {
    expect(blueprint.evidencePolicy).toMatchObject({
      readingItemsUpdateSupportingBicycleClaims: false,
      phonicsItemsUpdateBicycleClaims: false,
      grammarItemsUpdateBicycleClaims: false,
      graphItemsUpdateExactClaimRefs: true,
      chapterLocalPoemClaimsAllowed: false
    });
  });
});
