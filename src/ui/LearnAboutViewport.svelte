<script lang="ts">
  import type { Question } from '../contracts/question';
  import { LEARN_ABOUT_TOPICS } from '../experience/learnAboutCatalog';
  import { getLearnAboutTopicBinding } from '../experience/learnAboutBindings';
  import type { LearnAboutDepthBand } from '../experience/learnAboutContract';
  import { learnAboutRelationLabel, loadReviewedLearnAboutKnowledge, type LearnAboutKnowledgeRow } from '../experience/learnAboutKnowledge';
  import { createLearnAboutRuntimeSession } from '../experience/learnAboutRuntime';
  import { getTopicStudioActivityRefs } from '../experience/learningStudios';
  import StudioLauncher from './StudioLauncher.svelte';

  let { onExit, onStartQuestion, onTopicInterest = () => {} }: {
    onExit: () => void;
    onStartQuestion: (question: Question, title: string) => void;
    onTopicInterest?: (rootConceptRefs: readonly string[]) => void;
  } = $props();
  const depths: Array<{ id: LearnAboutDepthBand; label: string }> = [
    { id: 'd0_first_play', label: 'D0 Look' }, { id: 'd1_preschool', label: 'D1 Discover' },
    { id: 'd2_early_primary', label: 'D2 Connect' }, { id: 'd3_deeper_primary', label: 'D3+ Go deeper' }
  ];
  let selectedTopicId = $state<string | null>(null);
  let selectedDepth = $state<LearnAboutDepthBand>('d0_first_play');
  let knowledgeRows = $state<readonly LearnAboutKnowledgeRow[] | null>(null);
  let touchedRowId = $state<string | null>(null);
  let loadError = $state<string | null>(null);
  let selectedTopic = $derived(LEARN_ABOUT_TOPICS.find((topic) => topic.topicId === selectedTopicId));
  let selectedTitle = $derived(selectedTopic?.childTitle);
  let session = $derived(selectedTopicId && knowledgeRows ? createLearnAboutRuntimeSession(selectedTopicId, selectedDepth, knowledgeRows) : null);

  async function chooseTopic(topicId: string): Promise<void> {
    const topic = LEARN_ABOUT_TOPICS.find((item) => item.topicId === topicId);
    if (topic) onTopicInterest(topic.rootConceptRefs);
    selectedTopicId = topicId;
    selectedDepth = depths.find((depth) => topic?.sections.some((section) => section.depthBands.includes(depth.id)))?.id ?? 'd0_first_play';
    touchedRowId = null;
    loadError = null;
    try { knowledgeRows = await loadReviewedLearnAboutKnowledge(); }
    catch (error) { loadError = error instanceof Error ? error.message : 'This topic could not be opened.'; }
  }
  function retryTopic(): void { if (selectedTopicId) void chooseTopic(selectedTopicId); }
  function back(): void {
    if (selectedTopicId) { selectedTopicId = null; touchedRowId = null; loadError = null; return; }
    onExit();
  }
  function chooseDepth(depth: LearnAboutDepthBand): void { selectedDepth = depth; touchedRowId = null; }
  function depthAvailable(depth: LearnAboutDepthBand): boolean {
    const rank = depths.findIndex((candidate) => candidate.id === depth);
    return selectedTopic?.sections.some((section) => section.depthBands.some((band) => depths.findIndex((candidate) => candidate.id === band) <= rank)) ?? false;
  }
  function readableRow(row: LearnAboutKnowledgeRow): string { return `${row.subjectLabel} ${learnAboutRelationLabel(row.relation)} ${row.objectLabel}`; }
  function familyLabel(family: string): string {
    if (family === 'explore') return 'LOOK & TOUCH';
    if (family === 'did_you_know') return 'DID YOU KNOW?';
    return family.replaceAll('_', ' ').toUpperCase();
  }
</script>

<main class="learn-about" data-learn-about-view={selectedTopicId ? 'topic' : 'catalog'}>
  <header class="topbar">
    <button class="back" type="button" onclick={back} aria-label={selectedTopicId ? 'Back to Learn About topics' : 'Back to play'}>←</button>
    <div><small>LEARN ABOUT</small><h1>{session?.childTitle ?? selectedTitle ?? 'Choose something to explore'}</h1></div>
    {#if session}<b aria-hidden="true">{session.icon}</b>{/if}
  </header>
  {#if !selectedTopicId}
    <section class="topics" aria-label="Learn About topics">
      {#each LEARN_ABOUT_TOPICS as topic}
        <button class="topic" type="button" onclick={() => chooseTopic(topic.topicId)} aria-label={`Learn about ${topic.childTitle}`}>
          <span aria-hidden="true">{getLearnAboutTopicBinding(topic.topicId)?.icon ?? '🔎'}</span><strong>{topic.childTitle}</strong><small>Look · touch · discover</small>
        </button>
      {/each}
    </section>
  {:else if !session}
    <section aria-live="polite">
      {#if loadError}<p role="alert">{loadError}</p><button type="button" onclick={retryTopic}>Try again</button>{:else}<p>Opening {selectedTitle}…</p>{/if}
    </section>
  {:else}
    <nav class="depths" aria-label="Choose how deep to explore">
      {#each depths as depth}
        <button type="button" class:active={selectedDepth === depth.id} aria-pressed={selectedDepth === depth.id} disabled={!depthAvailable(depth.id)} onclick={() => chooseDepth(depth.id)}>{depth.label}</button>
      {/each}
    </nav>
    <div class="scroll" role="region" aria-label={`${session.childTitle} learning path`}>
      {#each session.sections as section (section.sectionId)}
        {@const studioRefs = getTopicStudioActivityRefs(session.topicId, section.sectionId, selectedDepth)}
        <section class="section" aria-labelledby={`${section.sectionId}-heading`}>
          <h2 id={`${section.sectionId}-heading`}>● {section.childTitle}</h2>
          <StudioLauncher activityRefs={studioRefs} />
          {#each section.cards as card}
            {#if !(studioRefs.length && card.family === 'explore' && card.knowledgeRows.length === 0)}
              <article class="card">
                <small>{familyLabel(card.family)}</small>
                {#if card.family === 'explore'}
                  {#if card.knowledgeRows.length}
                    <div class="rows">
                      {#each card.knowledgeRows as row}
                        <button type="button" onclick={() => touchedRowId = row.rowId} aria-label={`Explore ${row.subjectLabel}`}><span aria-hidden="true">{row.subjectSymbol ?? session.icon}</span> {row.subjectLabel}</button>
                      {/each}
                    </div>
                    {@const touched = card.knowledgeRows.find((row) => row.rowId === touchedRowId)}
                    {#if touched}<p aria-live="polite">{readableRow(touched)}.</p>{/if}
                  {:else}
                    <button class="wide" type="button" onclick={() => touchedRowId = card.cardId} aria-label={`Explore ${section.childTitle}`}><span aria-hidden="true">{session.icon}</span> {section.childTitle}</button>
                    {#if touchedRowId === card.cardId}<p aria-live="polite">You found this part of the topic.</p>{/if}
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
                    {#if touchedRowId === row.rowId}<p aria-live="polite">{readableRow(row)}.</p>{/if}
                  {/each}
                {:else if card.family === 'guess' && card.question && card.clue}
                  {#each card.clue.clues as clue}<p>🧩 {clue.text}</p>{/each}
                  <button class="wide action" type="button" onclick={() => onStartQuestion(card.question!, `Guess · ${session.childTitle}`)}>Choose an answer</button>
                {:else if card.family === 'practice' && card.question}
                  <button class="wide action" type="button" onclick={() => onStartQuestion(card.question!, `Practice · ${session.childTitle}`)}>Try this question</button>
                {/if}
              </article>
            {/if}
          {/each}
        </section>
      {/each}
    </div>
  {/if}
</main>

<style>
  .learn-about{width:min(760px,100%);height:calc(100dvh - 42px);margin:auto;display:flex;flex-direction:column;overflow:hidden}
  .learn-about button{min-height:46px;border:2px solid var(--line);border-radius:15px;background:#fff;color:var(--ink);font-weight:850;padding:8px 10px}
  .learn-about button:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
  .topbar{display:grid;grid-template-columns:46px 1fr auto;align-items:center;gap:9px;margin-bottom:9px}
  .back{font-size:1.2rem}.topbar small,.card>small{font-size:.63rem;letter-spacing:.06em;color:var(--muted);font-weight:900}
  h1{font-size:1.2rem;margin:2px 0;line-height:1.08}.topbar b{font-size:2rem}
  .topics{min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding-top:15px}
  .topic{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:145px!important}.topic span{font-size:3rem}.topic small{font-size:.68rem;color:var(--muted)}
  .depths{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-bottom:7px}.depths button{padding:7px 3px;font-size:.66rem}.depths .active{background:var(--accent-soft);border-color:var(--accent)}
  .scroll{flex:1;min-height:0;overflow:auto;padding:2px 3px 16px}.section{border-left:3px solid var(--accent-soft);padding-left:9px;margin:9px 0 13px}h2{font-size:.98rem;margin:0 0 6px}
  .card{background:#fff;border:1px solid #24303a18;border-radius:14px;padding:9px;margin:6px 0}.card p{font-size:.88rem;line-height:1.28;margin:6px 0}.rows{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.rows>span{background:var(--wash);border-radius:10px;padding:7px;font-size:.78rem}.wide{width:100%;margin-top:6px}.action{background:var(--accent-soft)!important}
  @media(max-width:480px){.topics{grid-template-columns:1fr;padding-top:2px}.topic{min-height:92px!important;display:grid;grid-template-columns:62px 1fr;gap:4px;text-align:left}.topic span{grid-row:1/3;font-size:2.6rem}.topic small{grid-column:2}}
</style>
