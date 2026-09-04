export interface Prompt { text: string; }
export interface SceneStimulus { type: 'scene'; sceneId: string; }
export interface Feedback { correct: string; incorrect: string; }
export interface AuthoringMetadata { status: 'draft' | 'reviewed'; source: string; compiledBy?: string; }

export interface BaseQuestion {
  id: string;
  revision: number;
  schemaVersion: 1;
  conceptIds: string[];
  /** Stable knowledge-row IDs this activity directly tests. */
  knowledgeRefs?: string[];
  /** Legacy/manual descriptive metadata only. Curriculum placement belongs to learning profiles. */
  gradeBands?: number[];
  difficulty: number;
  language: string;
  prompt: Prompt;
  stimulus?: SceneStimulus;
  feedback: Feedback;
  authoring: AuthoringMetadata;
}

/**
 * Semantic presentation hook shared by choice, fill, drag, memory and sequence
 * content. semanticRef names the underlying content entity (for example dog,
 * seahorse or kennel); visualRefs is an optional authored presentation override.
 * The presentation layer owns SVG artwork and motion for both forms.
 */
export interface PresentableItem {
  id: string;
  label: string;
  semanticRef?: string;
  visualRefs?: string[];
}

export type SingleChoicePresentationTier = 'first_play' | 'preschool' | 'early_primary';
export type SingleChoiceLabelMode = 'visible' | 'secondary' | 'hidden';
export interface SingleChoicePresentationHint {
  /** Layout/presentation only. Correctness remains exact_option + the canonical evaluator. */
  mode: 'visual_dominant';
  tier: SingleChoicePresentationTier;
  labels?: SingleChoiceLabelMode;
}

export interface ChoiceOption extends PresentableItem {}
export interface SingleChoiceQuestion extends BaseQuestion {
  interaction: {
    type: 'single_choice';
    version: 1;
    shuffleOptions?: boolean;
    options: ChoiceOption[];
    /** Optional visual-dominant child presentation; never changes answer semantics. */
    presentation?: SingleChoicePresentationHint;
  };
  solution: { type: 'exact_option'; correctOptionIds: string[]; };
}

export type FillSegment = { type: 'text'; value: string } | { type: 'blank'; id: string };
export interface WordBankItem extends PresentableItem {}
export interface WordBankFillQuestion extends BaseQuestion {
  interaction: { type: 'word_bank_fill'; version: 1; segments: FillSegment[]; wordBank: WordBankItem[]; };
  solution: { type: 'blank_answers'; answers: Record<string, string[]>; };
}

export interface DragItem extends PresentableItem { symbol?: string; }
export interface DragTarget extends PresentableItem { symbol?: string; }
export interface DragToTargetQuestion extends BaseQuestion {
  interaction: { type: 'drag_to_target'; version: 1; items: DragItem[]; targets: DragTarget[]; };
  solution: { type: 'target_assignment'; assignments: Record<string, string>; };
}

export type WordSearchDirection = 'right' | 'left' | 'down' | 'up' | 'down_right' | 'down_left' | 'up_right' | 'up_left';
export interface WordSearchTerm extends PresentableItem { word: string; }
export interface WordSearchQuestion extends BaseQuestion {
  interaction: { type: 'word_search'; version: 1; seed: number; gridSize?: number; directions?: WordSearchDirection[]; alphabet?: string; terms: WordSearchTerm[]; };
  solution: { type: 'found_terms'; requiredTermIds: string[]; };
}

export interface MemoryCard extends PresentableItem { symbol?: string; }
export interface MemoryPairsQuestion extends BaseQuestion {
  interaction: { type: 'memory_pairs'; version: 1; seed: number; cards: MemoryCard[]; };
  solution: { type: 'pair_matches'; pairs: Array<[string, string]>; };
}

export interface SequenceItem extends PresentableItem { symbol?: string; }
export interface SequenceOrderQuestion extends BaseQuestion {
  interaction: { type: 'sequence_order'; version: 1; seed: number; items: SequenceItem[]; };
  solution: { type: 'ordered_items'; orderedItemIds: string[]; };
}

export type HotspotShape =
  | { type: 'circle'; centerX: number; centerY: number; radius: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number };
export interface HotspotRegion extends PresentableItem { symbol?: string; shape: HotspotShape; }
export interface HotspotQuestion extends BaseQuestion {
  interaction: {
    type: 'hotspot';
    version: 1;
    selectionMode: 'single' | 'multiple';
    board: { ariaLabel: string; theme?: 'plain' | 'grass' | 'ocean' | 'sky' | 'split-land-water'; regions: HotspotRegion[]; };
  };
  solution: { type: 'selected_regions'; correctRegionIds: string[]; };
}

/** Device-independent 0..1 coordinate used by trace/draw interactions. */
export interface NormalizedPoint { x: number; y: number; }
export interface TraceAnchor extends PresentableItem { point: NormalizedPoint; symbol?: string; }
export interface TraceLandmark extends PresentableItem {
  x: number;
  y: number;
  width: number;
  height: number;
  symbol?: string;
}
export interface TracePathQuestion extends BaseQuestion {
  interaction: {
    type: 'trace_path';
    version: 1;
    board: {
      ariaLabel: string;
      theme?: 'plain' | 'grass' | 'sky' | 'room' | 'playground';
      start: TraceAnchor;
      goal: TraceAnchor;
      /** Authored route guide only. Scoring thresholds remain solution-owned. */
      guidePath: NormalizedPoint[];
      landmarks?: TraceLandmark[];
    };
  };
  solution: {
    type: 'trace_corridor';
    minPointCount: number;
    startRadius: number;
    goalRadius: number;
    corridorRadius: number;
    minInCorridorRatio: number;
    minGuideCoverage: number;
  };
}

export interface CrosswordEntry {
  id: string;
  clue: string;
  number: number;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  length: number;
}
export interface CrosswordQuestion extends BaseQuestion {
  interaction: { type: 'crossword'; version: 1; rows: number; cols: number; entries: CrosswordEntry[]; };
  solution: { type: 'crossword_answers'; answers: Record<string, string>; };
}

export interface MazePathQuestion extends BaseQuestion {
  interaction: {
    type: 'maze_path';
    version: 1;
    rows: number;
    cols: number;
    wallMasks: number[];
    startIndex: number;
    goalIndex: number;
    startLabel: string;
    startSymbol: string;
    goalLabel: string;
    goalSymbol: string;
  };
  solution: { type: 'maze_goal'; goalIndex: number; };
}

export type Question =
  | SingleChoiceQuestion
  | WordBankFillQuestion
  | DragToTargetQuestion
  | WordSearchQuestion
  | MemoryPairsQuestion
  | SequenceOrderQuestion
  | HotspotQuestion
  | TracePathQuestion
  | CrosswordQuestion
  | MazePathQuestion;
