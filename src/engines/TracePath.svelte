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

  function toPath(path: readonly NormalizedPoint[]): string {
    if (!path.length) return '';
    return path.map((point, index) => `${index === 0 ? 'M' : 'L'} ${(point.x * 100).toFixed(2)} ${(point.y * 100).toFixed(2)}`).join(' ');
  }

  function appendPoint(point: NormalizedPoint): void {
    const previous = points.at(-1);
    if (previous && pointDistance(previous, point) < 0.006) return;
    points = [...points, point];
  }

  function eventPoint(event: PointerEvent): NormalizedPoint {
    const bounds = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    return normalizeClientPoint(event.clientX, event.clientY, bounds);
  }

  function beginTrace(event: PointerEvent): void {
    if (locked) return;
    const target = event.currentTarget as SVGSVGElement;
    target.setPointerCapture(event.pointerId);
    points = [];
    keyboardStep = 0;
    drawing = true;
    appendPoint(eventPoint(event));
    status = 'Keep tracing along the path.';
  }

  function continueTrace(event: PointerEvent): void {
    if (!drawing || locked) return;
    appendPoint(eventPoint(event));
  }

  function finishTrace(event: PointerEvent): void {
    if (!drawing || locked) return;
    appendPoint(eventPoint(event));
    drawing = false;
    const target = event.currentTarget as SVGSVGElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    status = 'Path ready.';
    if (submissionMode === 'auto_when_complete') commit();
  }

  function cancelTrace(event: PointerEvent): void {
    drawing = false;
    const target = event.currentTarget as SVGSVGElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    status = points.length ? 'Path paused. Start again or use the step button.' : 'Start at the first marker.';
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
    status = `Start at ${question.interaction.board.start.label} and trace to ${question.interaction.board.goal.label}.`;
  }

  function advanceKeyboardPath(): void {
    if (locked || !guide.length) return;
    const next = Math.min(guide.length - 1, keyboardStep + 1);
    keyboardStep = next;
    points = guide.slice(0, next + 1).map((point) => ({ ...point }));
    if (next >= guide.length - 1) {
      status = 'Path ready.';
      if (submissionMode === 'auto_when_complete') commit();
    } else {
      status = `Path step ${next + 1} of ${guide.length}.`;
    }
  }
</script>

<div class="trace-path">
  <p class="trace-path__instructions">Trace the dotted path from the first marker to the last.</p>
  <svg
    class={`trace-path__board trace-path__board--${question.interaction.board.theme ?? 'plain'}`}
    viewBox="0 0 100 100"
    role="group"
    aria-label={question.interaction.board.ariaLabel}
    onpointerdown={beginTrace}
    onpointermove={continueTrace}
    onpointerup={finishTrace}
    onpointercancel={cancelTrace}
  >
    <path class="trace-path__corridor" d={guidePath} pathLength="100" />
    <path class="trace-path__guide" d={guidePath} pathLength="100" />

    {#each question.interaction.board.landmarks ?? [] as landmark (landmark.id)}
      <g class="trace-path__landmark" aria-hidden="true">
        <rect x={landmark.x * 100} y={landmark.y * 100} width={landmark.width * 100} height={landmark.height * 100} rx="5" />
        {#if landmark.symbol}<text class="trace-path__landmark-symbol" x={(landmark.x + landmark.width / 2) * 100} y={(landmark.y + landmark.height * .48) * 100}>{landmark.symbol}</text>{/if}
        <text class="trace-path__landmark-label" x={(landmark.x + landmark.width / 2) * 100} y={(landmark.y + landmark.height * .83) * 100}>{landmark.label}</text>
      </g>
    {/each}

    <circle class="trace-path__anchor trace-path__anchor--start" cx={question.interaction.board.start.point.x * 100} cy={question.interaction.board.start.point.y * 100} r="6" />
    <text class="trace-path__anchor-symbol" x={question.interaction.board.start.point.x * 100} y={question.interaction.board.start.point.y * 100 + 2}>{question.interaction.board.start.symbol ?? '●'}</text>
    <circle class="trace-path__anchor trace-path__anchor--goal" cx={question.interaction.board.goal.point.x * 100} cy={question.interaction.board.goal.point.y * 100} r="6" />
    <text class="trace-path__anchor-symbol" x={question.interaction.board.goal.point.x * 100} y={question.interaction.board.goal.point.y * 100 + 2}>{question.interaction.board.goal.symbol ?? '★'}</text>

    {#if childPath}
      <path class="trace-path__stroke" d={childPath} />
    {/if}
  </svg>

  <div class="trace-path__status" role="status" aria-live="polite">{status}</div>
  <div class="trace-path__actions">
    <button type="button" class="secondary-button trace-path__step" disabled={locked || keyboardStep >= guide.length - 1} onclick={advanceKeyboardPath}>
      Move along path
    </button>
    <button type="button" class="secondary-button" disabled={locked || (!points.length && keyboardStep === 0)} onclick={reset}>Start over</button>
    {#if submissionMode === 'explicit'}
      <button type="button" class="primary-button" disabled={locked || points.length < 2} onclick={commit}>Check path</button>
    {/if}
  </div>
</div>

<style>
  .trace-path { display: grid; gap: 8px; width: min(100%, 34rem); margin: 0 auto; }
  .trace-path__instructions { margin: 0; text-align: center; color: var(--muted); font-size: .78rem; font-weight: 800; }
  .trace-path__board {
    width: 100%;
    height: min(42vh, 280px);
    min-height: 210px;
    border: 2px solid rgba(36,48,58,.10);
    border-radius: 20px;
    background: #fffdf5;
    box-shadow: inset 0 0 0 5px rgba(255,255,255,.7);
    touch-action: none;
    user-select: none;
  }
  .trace-path__board--grass { background: linear-gradient(#dff1fb 0 52%,#d9efc5 52%); }
  .trace-path__board--sky { background: linear-gradient(#dff2ff,#f7fbff); }
  .trace-path__board--room { background: linear-gradient(#fff8df 0 68%,#eadcc3 68%); }
  .trace-path__board--playground { background: linear-gradient(#e3f4ff 0 58%,#dcedc8 58%); }
  .trace-path__corridor { fill: none; stroke: rgba(86,101,122,.12); stroke-width: 14; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
  .trace-path__guide { fill: none; stroke: rgba(54,72,94,.46); stroke-width: 2.4; stroke-dasharray: 3 3; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
  .trace-path__stroke { fill: none; stroke: var(--accent); stroke-width: 4.2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
  .trace-path__anchor { stroke: #fff; stroke-width: 2; pointer-events: none; }
  .trace-path__anchor--start { fill: #f8c54b; }
  .trace-path__anchor--goal { fill: #63ba78; }
  .trace-path__anchor-symbol { text-anchor: middle; dominant-baseline: middle; font-size: 8px; pointer-events: none; }
  .trace-path__landmark rect { fill: rgba(255,255,255,.88); stroke: rgba(36,48,58,.16); stroke-width: 1; }
  .trace-path__landmark-symbol { text-anchor: middle; dominant-baseline: middle; font-size: 13px; }
  .trace-path__landmark-label { text-anchor: middle; font-size: 4.2px; font-weight: 800; fill: #3d4650; }
  .trace-path__status { min-height: 20px; text-align: center; color: var(--muted); font-size: .74rem; font-weight: 800; }
  .trace-path__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; }
  .trace-path__actions button { min-height: 48px; }
  @media (max-width: 480px) {
    .trace-path__board { height: min(38vh, 245px); min-height: 190px; border-radius: 16px; }
    .trace-path__actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); }
    .trace-path__actions .primary-button { grid-column: 1 / -1; }
  }
</style>
