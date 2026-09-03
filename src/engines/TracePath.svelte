<script lang="ts">
  import type { NormalizedPoint, TracePathQuestion } from '../contracts/question';
  import { normalizeClientPoint, pointDistance } from '../mechanics/tracePath';
  import type { EngineProps } from './types';

  let {
    question,
    onSubmit,
    submissionMode = 'explicit'
  }: EngineProps<TracePathQuestion> = $props();

  let points = $state<NormalizedPoint[]>([]);
  let drawing = $state(false);
  let locked = $state(false);
  let keyboardStep = $state(0);
  let status = $state('Start at the first marker and trace to the last marker.');

  const guide = $derived(question.interaction.board.guidePath);
  const guidePath = $derived(toPath(guide));
  const childPath = $derived(toPath(points));
  const boardTheme = $derived(
    ['plain', 'grass', 'sky'].includes(question.interaction.board.theme ?? '')
      ? question.interaction.board.theme
      : 'plain'
  );

  function toPath(path: readonly NormalizedPoint[]): string {
    return path.map((point, index) => `${index ? 'L' : 'M'} ${point.x * 100} ${point.y * 100}`).join(' ');
  }

  function appendPoint(point: NormalizedPoint): void {
    const previous = points.at(-1);
    if (!previous || pointDistance(previous, point) >= 0.006) points = [...points, point];
  }

  function eventPoint(event: PointerEvent): NormalizedPoint {
    const bounds = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    return normalizeClientPoint(event.clientX, event.clientY, bounds);
  }

  function beginTrace(event: PointerEvent): void {
    if (locked) return;
    (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
    points = [];
    keyboardStep = 0;
    drawing = true;
    appendPoint(eventPoint(event));
    status = 'Keep tracing along the path.';
  }

  function continueTrace(event: PointerEvent): void {
    if (drawing && !locked) appendPoint(eventPoint(event));
  }

  function finishTrace(event: PointerEvent): void {
    if (!drawing || locked) return;
    appendPoint(eventPoint(event));
    drawing = false;
    status = 'Path ready.';
    if (submissionMode === 'auto_when_complete') commit();
  }

  function cancelTrace(): void {
    drawing = false;
    status = 'Start again from the first marker.';
  }

  function commit(): void {
    if (locked || points.length < 2) return;
    locked = true;
    onSubmit({ strokes: [{ points: points.map((point) => ({ ...point })) }] });
  }

  function reset(): void {
    if (locked) return;
    points = [];
    keyboardStep = 0;
    drawing = false;
    status = 'Start at the first marker and trace to the last marker.';
  }

  function advanceKeyboardPath(): void {
    if (locked || !guide.length) return;
    keyboardStep = Math.min(guide.length - 1, keyboardStep + 1);
    points = guide.slice(0, keyboardStep + 1).map((point) => ({ ...point }));
    status = keyboardStep === guide.length - 1 ? 'Path ready.' : `Path step ${keyboardStep + 1} of ${guide.length}.`;
    if (keyboardStep === guide.length - 1 && submissionMode === 'auto_when_complete') commit();
  }
</script>

<div class="hotspot">
  <p class="hotspot__instructions">Trace the dotted path from the first marker to the last.</p>
  <svg
    class={`hotspot__board hotspot__board--${boardTheme}`}
    style="touch-action: none"
    viewBox="0 0 100 100"
    role="group"
    aria-label={question.interaction.board.ariaLabel}
    onpointerdown={beginTrace}
    onpointermove={continueTrace}
    onpointerup={finishTrace}
    onpointercancel={cancelTrace}
  >
    <path d={guidePath} fill="none" stroke="#dfe4e8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" pointer-events="none" />
    <path d={guidePath} fill="none" stroke="#687785" stroke-width="2.4" stroke-dasharray="3 3" stroke-linecap="round" stroke-linejoin="round" pointer-events="none" />
    {#each question.interaction.board.landmarks ?? [] as landmark (landmark.id)}
      <text
        x={(landmark.x + landmark.width / 2) * 100}
        y={(landmark.y + landmark.height / 2) * 100}
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="14"
        pointer-events="none"
        aria-hidden="true"
      >{landmark.symbol ?? landmark.label}</text>
    {/each}
    <circle cx={question.interaction.board.start.point.x * 100} cy={question.interaction.board.start.point.y * 100} r="6" fill="#f8c54b" />
    <text x={question.interaction.board.start.point.x * 100} y={question.interaction.board.start.point.y * 100} text-anchor="middle" dominant-baseline="middle" font-size="8" pointer-events="none">{question.interaction.board.start.symbol ?? '●'}</text>
    <circle cx={question.interaction.board.goal.point.x * 100} cy={question.interaction.board.goal.point.y * 100} r="6" fill="#63ba78" />
    <text x={question.interaction.board.goal.point.x * 100} y={question.interaction.board.goal.point.y * 100} text-anchor="middle" dominant-baseline="middle" font-size="8" pointer-events="none">{question.interaction.board.goal.symbol ?? '★'}</text>
    {#if childPath}<path d={childPath} fill="none" stroke="var(--accent)" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" pointer-events="none" />{/if}
  </svg>
  <div class="hotspot__status" role="status" aria-live="polite">{status}</div>
  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 7px">
    <button type="button" class="secondary-button" style="min-height: 48px" disabled={locked || keyboardStep >= guide.length - 1} onclick={advanceKeyboardPath}>Move along path</button>
    <button type="button" class="secondary-button" style="min-height: 48px" disabled={locked || (!points.length && keyboardStep === 0)} onclick={reset}>Start over</button>
    {#if submissionMode === 'explicit'}<button type="button" class="primary-button" style="min-height: 48px" disabled={locked || points.length < 2} onclick={commit}>Check path</button>{/if}
  </div>
</div>
