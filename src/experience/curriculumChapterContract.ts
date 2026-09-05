export type CurriculumChapterVisual =
  | {
      kind: 'entity';
      visualRef: string;
      ariaLabel: string;
    }
  | {
      kind: 'animation';
      animationRef: string;
      ariaLabel: string;
    }
  | {
      kind: 'grid';
      visualRefs: string[];
      labels: string[];
      ariaLabel: string;
    }
  | {
      kind: 'tokens';
      tokens: string[];
      ariaLabel: string;
    };

export interface CurriculumChapterBeat {
  id: string;
  order: number;
  eyebrow: string;
  title: string;
  body: string;
  claimRefs: string[];
  capabilityRefs: string[];
  visual: CurriculumChapterVisual;
  sequence?: string[];
  exposureEvidence: 'none';
}

export interface CurriculumChapterPresentation {
  schemaVersion: 1;
  presentationId: string;
  moduleRef: string;
  childTitle: string;
  subtitle: string;
  badge: string;
  practicePackRef: string;
  chapterCheckPackRef: string;
  sourceExpression: {
    copied: false;
    sourceTextShown: false;
    sourceArtworkShown: false;
    policyRef: string;
  };
  beats: CurriculumChapterBeat[];
  completion: {
    title: string;
    body: string;
    masteryEvidence: 'none';
  };
}
