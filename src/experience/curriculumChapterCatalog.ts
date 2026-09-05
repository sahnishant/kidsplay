import bicycleWorkshopJson from '../../content/curriculum-presentations/bicycle-workshop.json';
import type { CurriculumChapterPresentation } from './curriculumChapterContract';

const presentations = [bicycleWorkshopJson as CurriculumChapterPresentation];
const presentationById = new Map(presentations.map((presentation) => [presentation.presentationId, presentation]));

function clonePresentation(presentation: CurriculumChapterPresentation): CurriculumChapterPresentation {
  return {
    ...presentation,
    sourceExpression: { ...presentation.sourceExpression },
    beats: presentation.beats.map((beat) => ({
      ...beat,
      claimRefs: [...beat.claimRefs],
      capabilityRefs: [...beat.capabilityRefs],
      sequence: beat.sequence ? [...beat.sequence] : undefined,
      visual: beat.visual.kind === 'entity'
        ? { ...beat.visual }
        : beat.visual.kind === 'animation'
          ? { ...beat.visual }
          : beat.visual.kind === 'grid'
            ? { ...beat.visual, visualRefs: [...beat.visual.visualRefs], labels: [...beat.visual.labels] }
            : { ...beat.visual, tokens: [...beat.visual.tokens] }
    })),
    completion: { ...presentation.completion }
  };
}

export function getCurriculumChapterPresentation(presentationId: string): CurriculumChapterPresentation {
  const presentation = presentationById.get(presentationId);
  if (!presentation) throw new Error(`Unknown curriculum chapter presentation ${presentationId}`);
  return clonePresentation(presentation);
}

export function getBicycleWorkshopPresentation(): CurriculumChapterPresentation {
  return getCurriculumChapterPresentation('curriculum-presentation.bicycle-workshop.v1');
}
