<script lang="ts">
  import type { Question } from '../contracts/question';
  import { LEARN_ABOUT_TOPICS } from '../experience/learnAboutCatalog';
  import type { LearnAboutDepthBand } from '../experience/learnAboutContract';
  import {
    learnAboutRelationLabel,
    loadReviewedLearnAboutKnowledge,
    type LearnAboutKnowledgeRow
  } from '../experience/learnAboutKnowledge';
  import { createLearnAboutRuntimeSession } from '../experience/learnAboutRuntime';

  let { onExit, onStartQuestion }: {
    onExit: () => void;
    onStartQuestion: (question: Question, title: string) => void;
  } = $props();

  const depths: Array<{ id: LearnAboutDepthBand; label: string }> = [
    { id: 'd0_first_play', label: 'D0 Look' },
    { id: 'd1_preschool', label: 'D1 Discover' },
    { id: 'd2_early_primary', label: 'D2 Connect' },
    { id: 'd3_deeper_primary', label: 'D3+ Go deeper' }
  ];
  const icons: Readonly<Record<string, string>> = {
    'learn.earth': '🌍', 'learn.lion': '🦁', 'learn.fire-station': '🚒'
  };

  let selectedTopicId = $state<string | null>(null);
  let selectedDepth = $state<LearnAboutDepthBand>('d0_first_play');
  let knowledgeRows = $state<readonly LearnAboutKnowledgeRow[] | null>(null);
  let touchedRowId = $state<string | null>(null);
  let loadError = $state<string | null>(null);
  let selectedTitle = $derived(LEARN_ABOUT_TOPICS.find((topic) => topic.topicId === selectedTopicId)?.childTitle);
  let session = $derived(selectedTopicId && knowledgeRows
    ? createLearnAboutRuntimeSession(selectedTopicId, selectedDepth, knowledgeRows)
    : null);

  async function chooseTopic(topicId: string): Promise<void> {
    selectedTopicId = topicId;
    selectedDepth = 'd0_first_play';
    touchedRowId = null;
    loadError = null;
    try {
      knowledgeRows = await loadReviewedLearnAboutKnowledge();
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'This topic could not be opened.';
    }
  }

  function back(): void {
    if (selectedTopicId) {
      selectedTopicId = null;
      touchedRowId = null;
      loadError = null;
      return;
    }
    onExit();
  }

  function chooseDepth(depth: LearnAboutDepthBand): void {
    selectedDepth = depth;
    touchedRowId = null;
  }

  function readableRow(row: LearnAboutKnowledgeRow): string {
    return `${row.subjectLabel} ${learnAboutRelationLabel(row.relation)} ${row.objectLabel}`;
  }
</script>

<main class="learn-about" data-learn-about-view={selectedTopicId ? 'topic' : 'catalog'}>
  <header class="topbar">
    <button class="back" type="button" onclick={back} aria-label={selectedTopicId ? 'Back to Learn About topics' : 'Back to play'}>←</button>
    <div><small>LEARN ABOUT</small><h1>{session?.childTitle ?? selectedTitle ?? 'Choose something to explore'}</h1></div>
    {#if session}<b class="icon" aria-hidden="true">{session.icon}</b>{/if}
  </header>

  {#if !selectedTopicId}
    <section class="topics" aria-label="Learn About topics">
      {#each LEARN_ABOUT_TOPICS as topic}
        <button class="topic" type="button" onclick={() => chooseTopic(topic.topicId)} aria-label={`Learn about ${topic.childTitle}`}>
          <span aria-hidden="true">{icons[topic.topicId] ?? '🔎'}</span><strong>{topic.childTitle}</strong><small>Look · touch · discover</small>
        </button>
      {/each}
    </section>
  {:else if !session}
    <section class="loading" aria-live="polite">
      {#if loadError}<p role="alert">{loadError}</p><button type="button" onclick={() => chooseTopic(selectedTopicId)}>Try again</button>{:else}<p>Opening {selectedTitle}…</p>{/if}
    </section>
  {:else}
    <nav class="depths" aria-label="Choose how deep to explore">
      {#each depths as depth}
        <button type="button" class:active={selectedDepth === depth.id} aria-pressed={selectedDepth === depth.id} onclick={() => chooseDepth(depth.id)}>{depth.label}</button>
      {/each}
    </nav>

    <div class="scroll" role="region" aria-label={`${session.childTitle} learning path`}>
      {#each session.sections as section}
        <section class="section" aria-labelledby={`${section.sectionId}-heading`}>
          <h2 id={`${section.sectionId}-heading`}>● {section.childTitle}</h2>
          {#each section.cards as card}
            <article class="card">
              <small class="label">{card.family === 'explore' ? 'LOOK & TOUCH' : card.family.replaceAll('_', ' ').toUpperCase()}</small>
              {#if card.family === 'explore'}
                {#if card.knowledgeRows.length}
                  <div class="rows">
                    {#each card.knowledgeRows as row}
                      <button type="button" onclick={() => touchedRowId = row.rowId} aria-label={`Explore ${row.subjectLabel}`}><span aria-hidden="true">{row.subjectSymbol ?? session.icon}</span> {row.subjectLabel}</button>
                    {/each}
                  </div>
                  {@const touched = card.knowledgeRows.find((row) => row.rowId === touchedRowId)}
                  {#if touched}<p class="reveal" aria-live="polite">{readableRow(touched)}.</p>{/if}
                {:else}
                  <button class="wide" type="button" onclick={() => touchedRowId = card.cardId} aria-label={`Explore ${section.childTitle}`}><span aria-hidden="true">{session.icon}</span> {section.childTitle}</button>
                  {#if touchedRowId === card.cardId}<p class="reveal" aria-live="polite">You found this part of the topic.</p>{/if}
                {/if}
              {:else if card.family === 'did_you_know'}
                {#each card.knowledgeRows as row}<p><strong>{row.subjectLabel}</strong> {learnAboutRelationLabel(row.relation)} <strong>{row.objectLabel}</strong>.</p>{/each}
              {:else if card.family === 'compare'}
                <p>What is the same or different?</p>
                <div class="rows">{#each card.knowledgeRows as row}<span><strong>{row.subjectLabel}</strong> · {learnAboutRelationLabel(row.relation)} {row.objectLabel}</span>{/each}</div>
              {:else if card.family === 'try_it'}
                <p>Tap the idea, then say what changes.</p>
                {#each card.knowledgeRows as row}
                  <button type="button" onclick={() => touchedRowId = row.rowId}>{row.subjectLabel}</button>
                  {#if touchedRowId === row.rowId}<p class="reveal" aria-live="polite">{readableRow(row)}.</p>{/if}
                {/each}
              {:else if card.family === 'guess' && card.question && card.riddle}
                {#each card.riddle.clue.clues as clue}<p>🧩 {clue.text}</p>{/each}
                <button class="wide action" type="button" onclick={() => onStartQuestion(card.question!, `Guess · ${session.childTitle}`)}>Choose an answer</button>
              {:else if card.family === 'practice' && card.question}
                <button class="wide action" type="button" onclick={() => onStartQuestion(card.question!, `Practice · ${session.childTitle}`)}>Try this question</button>
              {/if}
            </article>
          {/each}
        </section>
      {/each}
    </div>
  {/if}
</main>

<style>
  .learn-about{width:min(760px,100%);height:calc(100dvh - 42px);margin:auto;display:flex;flex-direction:column;gap:6px;overflow:hidden}.learn-about button{min-height:46px;border:0;border-radius:10px;font:inherit;font-weight:850;cursor:pointer}.topbar{display:grid;grid-template-columns:46px 1fr auto;align-items:center;gap:6px}.back{width:46px;background:var(--accent-soft);color:var(--accent);font-size:1.2rem}.topbar small,.label{color:var(--accent);font-weight:900}.topbar h1,.section h2{margin:0}.topbar h1{font-size:1.08rem}.icon{font-size:1.7rem}.topics,.scroll{min-height:0;overflow:auto}.topics{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;align-content:start}.topic{min-height:120px;display:grid;place-items:center;background:#fff}.topic>span{font-size:3rem}.topic small{color:var(--muted)}.depths{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.depths button{font-size:.62rem;background:#fff}.active,.action{background:var(--accent)!important;color:#fff}.scroll{flex:1}.section{margin-bottom:6px;padding:8px;background:#fff}.section h2{font-size:.94rem}.card{margin-top:6px;padding:8px;background:#f7f9fb}.card p{margin:4px 0;font-size:.77rem;line-height:1.35}.label{display:block}.rows{display:flex;flex-wrap:wrap;gap:5px}.rows button,.rows span,.card>button{padding:6px;background:#fff}.rows span{font-size:.72rem}.wide{width:100%}.reveal{background:#fff}.loading{text-align:center}button:focus-visible{outline:3px solid #1b6dff;outline-offset:2px}@media(max-width:520px){.topics{grid-template-columns:1fr}.topic{min-height:100px;grid-template-columns:auto 1fr;justify-items:start}.topic>span{grid-row:1/3}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
