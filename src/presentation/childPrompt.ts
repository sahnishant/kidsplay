export type ChildPromptPart =
  | { kind: 'text'; text: string }
  | { kind: 'blank'; text: 'blank' };

const BLANK_RUN = /_{2,}/g;
const ONLY_BLANK_RUN = /^_{2,}$/;

/**
 * Convert authored underscore runs into a semantic blank for child-facing
 * presentation. This is deliberately generic: content authors may use any run
 * of two or more underscores and every session renders it the same way.
 */
export function childPromptParts(text: string): ChildPromptPart[] {
  return text
    .split(/(_{2,})/g)
    .filter((part) => part.length > 0)
    .map((part) => ONLY_BLANK_RUN.test(part)
      ? { kind: 'blank', text: 'blank' as const }
      : { kind: 'text', text: part });
}

/**
 * TTS must never read an authored blank as "underscore underscore...".
 * Each underscore run becomes the single spoken word "blank" while ordinary
 * single underscores remain untouched.
 */
export function childPromptSpeechText(text: string): string {
  return text
    .replace(BLANK_RUN, ' blank ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
