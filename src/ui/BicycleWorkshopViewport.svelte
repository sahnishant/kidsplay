<script lang="ts">
  import './bicycleWorkshop.css';
  import guideJson from '../../content/experience/bicycle-workshop-guided.json';
  import { getWorkshopStudioActivityRefs } from '../experience/learningStudios';

  type StoryMode='meet'|'parts'|'mechanics'|'sounds'|'magic'|'reading'|'safety';
  type Beat={id:string;label:string;text:string;examples?:string[];sequence?:string[];claimRefs?:string[];capabilityRefs?:string[]};
  type Section={id:string;order:number;navLabel?:string;storyMode:StoryMode;sourceLayer?:string;eyebrow:string;title:string;animationRef?:string;visualRef?:string;storyLead?:string;lookPrompt:string;beats:Beat[];remember:string;childPrompt:string};
  const guide=guideJson as {childTitle:string;subtitle:string;sections:Section[]};
  const storyStagePromise=import('./BicycleStoryStage.svelte');
  const mechanismComponentPromise=import('../presentation/BicycleMechanismDemonstration.svelte');
  const studioLauncherPromise=import('./StudioLauncher.svelte');
  let {onExit,onPractice,onChapterCheck}:{onExit:()=>void;onPractice:()=>void;onChapterCheck:()=>void}=$props();
  let part=$state(0),idea=$state(0);
  let section=$derived(guide.sections[part]),beat=$derived(section.beats[idea]);
  let first=$derived(part===0&&idea===0),lastIdea=$derived(idea===section.beats.length-1),done=$derived(part===guide.sections.length-1&&lastIdea);
  let semanticVisualRef=$derived(section.animationRef??section.visualRef??'');
  let studioRefs=$derived(getWorkshopStudioActivityRefs('bicycle-workshop',section.id));
  function next(){if(!lastIdea){idea++;return}if(part<guide.sections.length-1){part++;idea=0}}
  function previous(){if(idea){idea--;return}if(part){part--;idea=guide.sections[part].beats.length-1}}
  function openPart(index:number){part=index;idea=0}
</script>

<main class="workshop" data-workshop-section={section.id} data-workshop-idea={beat.id}>
  <header class="top"><button type="button" onclick={onExit} aria-label="Back to play">←</button><div><small>CLASS 2 ENGLISH · STORY WORKSHOP</small><h1>{guide.childTitle}</h1><p>{guide.subtitle}</p></div><b>{part+1}/{guide.sections.length}</b></header>
  <nav class="steps" aria-label="Bicycle Workshop learning sections">{#each guide.sections as item,index}<button type="button" class:active={index===part} aria-current={index===part?'step':undefined} onclick={()=>openPart(index)}><b>{index+1}</b><small>{item.navLabel??item.id}</small></button>{/each}</nav>

  <section class="body" aria-labelledby="section-title"><article class="lesson">
    <header class="title"><small>{section.eyebrow}</small><h2 id="section-title">{section.title}</h2></header>
    {#if section.storyLead}<p class="story"><b>✦</b>{section.storyLead}</p>{/if}
    <p class="look"><b>LOOK · NOTICE</b>{section.lookPrompt}</p>
    <div class:visual--mechanism={section.id==='movement'} class="visual" data-visual-ref={semanticVisualRef} data-story-mode={section.storyMode}>
      {#if section.id==='movement'}
        <div class="mechanism-boundary"><b>LOOK INSIDE</b><span>Kidsplay extra · no score</span></div>
        {#await mechanismComponentPromise}
          <div class="stage-loading" aria-label="Loading bicycle mechanism">🚲</div>
        {:then module}
          {@const BicycleMechanismDemonstration=module.default}
          {#key beat.id}<BicycleMechanismDemonstration mode={beat.id==='braking-chain'?'brake':'drive'}/>{/key}
        {/await}
      {:else}
        {#await storyStagePromise}<div class="stage-loading" aria-label="Loading bicycle">🚲</div>{:then module}{@const StoryStage=module.default}<StoryStage mode={section.storyMode}/>{/await}
      {/if}
    </div>

    <div class="learn">
      <div class="ideas" aria-label={`Ideas in ${section.title}`}>{#each section.beats as item,index}<button type="button" class:active={index===idea} onclick={()=>idea=index} aria-label={`Open idea ${index+1}: ${item.label}`}>{index+1}</button>{/each}</div>
      <section class:extra={section.sourceLayer==='kidsplay_enrichment'} class="beat" aria-live="polite" data-claim-count={beat.claimRefs?.length??0} data-capability-count={beat.capabilityRefs?.length??0}>
        <small>LEARN · DISCOVER · IDEA {idea+1}</small><h3>{beat.label}</h3><p>{beat.text}</p>
        {#if beat.sequence?.length && section.id!=='movement'}<div class="chips" aria-label={`${beat.label} sequence`}>{#each beat.sequence as value,index}<span>{value}</span>{#if index<beat.sequence.length-1}<b>→</b>{/if}{/each}</div>{/if}
        {#if beat.examples?.length}<div class="chips">{#each beat.examples as value}<span>{value}</span>{/each}</div>{/if}
      </section>
      {#if lastIdea}<aside><b>REMEMBER</b><p>{section.remember}</p></aside>{:else}<p class="pace">One idea at a time. Tap <b>Next idea</b> when ready.</p>{/if}
      {#if studioRefs.length}
        {#key section.id}
          {#await studioLauncherPromise}{:then module}{@const StudioLauncher=module.default}<StudioLauncher activityRefs={studioRefs}/>{/await}
        {/key}
      {/if}
    </div>
    {#if lastIdea}<p class="try"><b>YOUR TURN</b><span>{section.childPrompt}</span><small>No score here — just explore.</small></p>{/if}
  </article></section>

  <footer><button type="button" onclick={previous} disabled={first}>Previous</button>{#if !done}<button class="primary" type="button" onclick={next} aria-label={lastIdea?'Next part — continue story':'Next idea'}>{lastIdea?'Continue story':'Next idea'}</button>{:else}<div><button type="button" onclick={onPractice}>Practice</button><button class="primary" type="button" onclick={onChapterCheck}>Chapter check</button></div>{/if}</footer>
</main>
