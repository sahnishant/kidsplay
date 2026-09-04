<script lang="ts">
  import type { Question } from '../contracts/question';
  import { LEARN_ABOUT_TOPICS } from '../experience/learnAboutCatalog';
  import type { LearnAboutDepthBand } from '../experience/learnAboutContract';
  import { learnAboutRelationLabel, type LearnAboutKnowledgeRow } from '../experience/learnAboutKnowledge';
  import { createLearnAboutRuntimeSession } from '../experience/learnAboutRuntime';

  let {
    onExit,
    onStartQuestion
  }: {
    onExit: () => void;
    onStartQuestion: (question: Question, title: string) => void;
  } = $props();

  const depths: Array<{ id: LearnAboutDepthBand; label: string; short: string }> = [
    { id: 'd0_first_play', label: 'Look', short: 'D0' },
    { id: 'd1_preschool', label: 'Discover', short: 'D1' },
    { id: 'd2_early_primary', label: 'Connect', short: 'D2' },
    { id: 'd3_deeper_primary', label: 'Go deeper', short: 'D3+' }
  ];
  const topicIcons: Readonly<Record<string, string>> = {
    'learn.earth': '🌍',
    'learn.lion': '🦁',
    'learn.fire-station': '🚒'
  };

  let selectedTopicId = $state<string | null>(null);
  let selectedDepth = $state<LearnAboutDepthBand>('d0_first_play');
  let touchedRowId = $state<string | null>(null);
  let session = $derived(selectedTopicId ? createLearnAboutRuntimeSession(selectedTopicId, selectedDepth) : null);

  function chooseTopic(topicId: string): void {
    selectedTopicId = topicId;
    selectedDepth = 'd0_first_play';
    touchedRowId = null;
  }

  function back(): void {
    if (selectedTopicId) {
      selectedTopicId = null;
      touchedRowId = null;
      return;
    }
    onExit();
  }

  function chooseDepth(depth: LearnAboutDepthBand): void {
    selectedDepth = depth;
    touchedRowId = null;
  }

  function reveal(row: LearnAboutKnowledgeRow): void {
    touchedRowId = row.rowId;
  }

  function readableRow(row: LearnAboutKnowledgeRow): string {
    return `${row.subjectLabel} ${learnAboutRelationLabel(row.relation)} ${row.objectLabel}`;
  }

  function startQuestion(question: Question | undefined, title: string): void {
    if (question) onStartQuestion(question, title);
  }
</script>

<main class="learn-about" data-learn-about-view={selectedTopicId ? 'topic' : 'catalog'}>
  <header class="learn-about__topbar">
    <button class="back-button" type="button" onclick={back} aria-label={selectedTopicId ? 'Back to Learn About topics' : 'Back to play'}>←</button>
    <div>
      <span class="eyebrow">LEARN ABOUT</span>
      <h1>{session?.childTitle ?? 'Choose something to explore'}</h1>
    </div>
    {#if session}<span class="topic-icon" aria-hidden="true">{session.icon}</span>{/if}
  </header>

  {#if !session}
    <section class="topic-grid" aria-label="Learn About topics">
      {#each LEARN_ABOUT_TOPICS as topic}
        <button class="topic-card" type="button" onclick={() => chooseTopic(topic.topicId)} aria-label={`Learn about ${topic.childTitle}`}>
          <span class="topic-card__icon" aria-hidden="true">{topicIcons[topic.topicId] ?? '🔎'}</span>
          <strong>{topic.childTitle}</strong>
          <small>Look · touch · discover</small>
        </button>
      {/each}
    </section>
  {:else}
    <nav class="depth-picker" aria-label="Choose how deep to explore">
      {#each depths as depth}
        <button
          type="button"
          class:depth-button--active={selectedDepth === depth.id}
          class="depth-button"
          aria-pressed={selectedDepth === depth.id}
          onclick={() => chooseDepth(depth.id)}
        >
          <span>{depth.short}</span>{depth.label}
        </button>
      {/each}
    </nav>

    <div class="topic-scroll" role="region" aria-label={`${session.childTitle} learning path`}>
      {#each session.sections as section}
        <section class="spine-section" aria-labelledby={`${section.sectionId}-heading`}>
          <header class="spine-section__header">
            <span class="spine-dot" aria-hidden="true"></span>
            <h2 id={`${section.sectionId}-heading`}>{section.childTitle}</h2>
          </header>

          <div class="card-stack">
            {#each section.cards as card}
              {#if card.family === 'explore'}
                <article class="activity-card activity-card--explore">
                  <span class="activity-label">LOOK & TOUCH</span>
                  {#if card.knowledgeRows.length > 0}
                    <div class="touch-row-list">
                      {#each card.knowledgeRows as row}
                        <button class="touch-row" type="button" onclick={() => reveal(row)} aria-label={`Explore ${row.subjectLabel}`}>
                          <span aria-hidden="true">{row.subjectSymbol ?? session.icon}</span>
                          <strong>{row.subjectLabel}</strong>
                        </button>
                      {/each}
                    </div>
                    {#if touchedRowId}
                      {@const touched = card.knowledgeRows.find((row) => row.rowId === touchedRowId)}
                      {#if touched}
                        <p class="semantic-reveal" aria-live="polite">{readableRow(touched)}.</p>
                      {/if}
                    {/if}
                  {:else}
                    <button class="neutral-explore" type="button" onclick={() => touchedRowId = card.cardId} aria-label={`Explore ${section.childTitle}`}>
                      <span aria-hidden="true">{session.icon}</span>
                      <strong>{section.childTitle}</strong>
                    </button>
                    {#if touchedRowId === card.cardId}
                      <p class="semantic-reveal" aria-live="polite">You found this part of the topic.</p>
                    {/if}
                  {/if}
                </article>
              {:else if card.family === 'did_you_know'}
                <article class="activity-card activity-card--fact">
                  <span class="activity-label">DID YOU KNOW?</span>
                  {#each card.knowledgeRows as row}
                    <p class="canonical-row"><strong>{row.subjectLabel}</strong> {learnAboutRelationLabel(row.relation)} <strong>{row.objectLabel}</strong>.</p>
                  {/each}
                </article>
              {:else if card.family === 'compare'}
                <article class="activity-card">
                  <span class="activity-label">COMPARE</span>
                  <p class="card-prompt">Look at these relationships. What is the same or different?</p>
                  <div class="compare-grid">
                    {#each card.knowledgeRows as row}
                      <div class="compare-chip"><strong>{row.subjectLabel}</strong><span>{learnAboutRelationLabel(row.relation)} {row.objectLabel}</span></div>
                    {/each}
                  </div>
                </article>
              {:else if card.family === 'try_it'}
                <article class="activity-card">
                  <span class="activity-label">TRY IT</span>
                  <p class="card-prompt">Tap the idea, then say what changes.</p>
                  {#each card.knowledgeRows as row}
                    <button class="try-button" type="button" onclick={() => reveal(row)}>{row.subjectLabel}</button>
                    {#if touchedRowId === row.rowId}<p class="semantic-reveal" aria-live="polite">{readableRow(row)}.</p>{/if}
                  {/each}
                </article>
              {:else if card.family === 'guess' && card.question && card.riddle}
                <article class="activity-card activity-card--guess">
                  <span class="activity-label">GUESS</span>
                  <div class="clue-list" aria-label="Riddle clues">
                    {#each card.riddle.clue.clues as clue}<p>🧩 {clue.text}</p>{/each}
                  </div>
                  <button class="question-button" type="button" onclick={() => startQuestion(card.question, `Guess · ${session.childTitle}`)}>Choose an answer</button>
                </article>
              {:else if card.family === 'practice' && card.question}
                <article class="activity-card">
                  <span class="activity-label">PRACTICE</span>
                  <button class="question-button" type="button" onclick={() => startQuestion(card.question, `Practice · ${session.childTitle}`)}>Try this question</button>
                </article>
              {/if}
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</main>

<style>
  .learn-about{width:min(760px,100%);height:calc(100dvh - 42px);margin:auto;display:flex;flex-direction:column;gap:6px;overflow:hidden;color:var(--ink)}
  .learn-about button{font:inherit;cursor:pointer}.learn-about__topbar{display:grid;grid-template-columns:46px 1fr auto;align-items:center;gap:8px;padding:5px;border:1px solid #24303a17;border-radius:16px;background:#fff}.back-button{width:46px;height:46px;border:0;border-radius:13px;background:var(--accent-soft);color:var(--accent);font-size:1.2rem;font-weight:950}.eyebrow,.activity-label{color:var(--accent);font-size:.58rem;font-weight:950;letter-spacing:.07em}.learn-about h1,.learn-about h2{margin:0}.learn-about h1{font-size:1.1rem}.learn-about h2{font-size:.95rem}.topic-icon{font-size:1.7rem}
  .topic-grid,.topic-scroll{min-height:0;overflow:auto}.topic-grid{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-content:start}.topic-card{min-height:150px;display:grid;place-items:center;align-content:center;gap:6px;padding:12px;border:1px solid #24303a1c;border-radius:20px;background:#fff;color:var(--ink)}.topic-card__icon{font-size:3rem}.topic-card small{color:var(--muted);font-weight:800}
  .depth-picker{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.depth-button{min-height:48px;display:grid;place-items:center;padding:3px;border:1px solid #24303a20;border-radius:12px;background:#fff;color:var(--ink);font-size:.64rem;font-weight:850}.depth-button span{font-size:.54rem;color:var(--muted)}.depth-button--active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
  .topic-scroll{flex:1;padding-bottom:12px}.spine-section{margin-bottom:9px;padding:10px;border:1px solid #24303a14;border-radius:17px;background:#fff}.spine-section__header{display:flex;align-items:center;gap:7px}.spine-dot{width:9px;height:9px;border-radius:50%;background:var(--accent)}.card-stack{display:grid;gap:7px;margin-top:7px}.activity-card{padding:9px;border-radius:14px;background:#f7f9fb}.activity-card--explore{background:#fff8e9}.activity-card--fact{background:#f2f8ff}.activity-card--guess{background:#f6f2ff}.activity-label{display:block;margin-bottom:5px}.activity-card p{margin:4px 0;font-size:.77rem;line-height:1.35}
  .touch-row-list,.compare-grid{display:flex;flex-wrap:wrap;gap:6px}.touch-row,.neutral-explore,.try-button,.question-button{min-height:48px;border:0;border-radius:12px;font-weight:900}.touch-row{display:flex;align-items:center;gap:6px;padding:6px 9px;background:#fff}.touch-row span{font-size:1.35rem}.neutral-explore,.question-button{width:100%}.neutral-explore{display:grid;place-items:center;padding:7px;background:#fff;color:var(--ink)}.neutral-explore span{font-size:1.8rem}.semantic-reveal,.compare-chip{padding:7px;border-radius:10px;background:#fff}.compare-chip{display:grid;min-width:120px;font-size:.7rem}.compare-chip span{color:var(--muted)}.try-button{padding:6px 10px;background:#fff;color:var(--accent)}.question-button{margin-top:6px;padding:7px 10px;background:var(--accent);color:#fff}
  button:focus-visible{outline:3px solid #1b6dff;outline-offset:2px}@media(max-width:520px){.topic-grid{grid-template-columns:1fr}.topic-card{min-height:112px;grid-template-columns:auto 1fr;justify-items:start}.topic-card__icon{grid-row:1/3}.compare-grid{display:grid}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style>
