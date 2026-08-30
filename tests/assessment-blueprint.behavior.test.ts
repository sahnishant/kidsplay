import { describe, expect, it } from 'vitest';
import blueprint from '../content/assessment-blueprints/SOF_INDIA_CLASS2_2026-27.json';
import { createSessionForCatalogEntry, getCatalogEntries } from '../src/content';

describe('assessment blueprint delivery', () => {
  it('keeps catalog messaging and session length driven by the blueprint', () => {
    const entry = getCatalogEntries().find((item) => item.id.includes(`pattern-mock-${blueprint.academicYear}`));
    expect(entry).toBeTruthy();
    expect(entry).toMatchObject({
      title: blueprint.title,
      description: blueprint.description,
      actionLabel: blueprint.actionLabel,
      profileRef: blueprint.profileRef
    });

    const session = createSessionForCatalogEntry(entry!.id, {});
    expect(session.questions).toHaveLength(blueprint.totalQuestions);
    expect(session.sections?.reduce((sum, section) => sum + section.count, 0)).toBe(blueprint.totalQuestions);
  });

  it('preserves blueprint section order and boundaries in the delivered session', () => {
    const entry = getCatalogEntries().find((item) => item.id.includes(`pattern-mock-${blueprint.academicYear}`));
    const session = createSessionForCatalogEntry(entry!.id, {});

    let expectedStartIndex = 0;
    expect(session.sections).toHaveLength(blueprint.sections.length);
    for (const [index, section] of blueprint.sections.entries()) {
      expect(session.sections?.[index]).toEqual({
        id: section.id,
        title: section.title,
        startIndex: expectedStartIndex,
        count: section.count
      });
      expectedStartIndex += section.count;
    }
    expect(expectedStartIndex).toBe(blueprint.totalQuestions);
  });
});
