<script lang="ts">
  import './bicycleStoryStage.css';
  import bikeUrl from './bicycleStoryBike.svg?url';
  type StoryMode='meet'|'parts'|'mechanics'|'sounds'|'magic'|'reading'|'safety';
  type PartId='seat'|'pedal'|'wheel'|'bell'|'handle'|'carrier'|'brake';
  let { mode }: { mode:StoryMode }=$props();
  const parts:{id:PartId;label:string;x:number;y:number;w:number;h:number}[]=[
    {id:'seat',label:'Seat',x:39,y:30,w:13,h:10},{id:'pedal',label:'Pedal',x:47,y:67,w:15,h:25},{id:'wheel',label:'Wheel',x:72,y:67,w:29,h:53},
    {id:'bell',label:'Bell',x:67,y:25,w:9,h:16},{id:'handle',label:'Handle',x:70,y:23,w:14,h:12},{id:'carrier',label:'Carrier',x:23,y:42,w:19,h:15},{id:'brake',label:'Brake',x:68,y:50,w:11,h:20}
  ];
  const magicPlaces=['Cloud garden','Moonlit hill','My own place'] as const;
  const safetyItems=['Helmet','Brakes','Tyres'] as const;
  let selectedPart=$state<PartId>('pedal'),focusRun=$state(0),bellRun=$state(0),magicPlace=$state(''),safetyMask=$state(0);
  let selected=$derived(parts.find((item)=>item.id===selectedPart)??parts[1]);
</script>

<section class="bike-stage" data-story-mode={mode}>
  <div class:magic={mode==='magic'} class="bike-scene">
    <div class="bike-canvas">
      <img class="bike" src={bikeUrl} alt="Large original side-view bicycle"/>
      {#if mode==='parts'}
        {#key focusRun}
          <div class="part-focus" data-focus-part={selectedPart} style={`left:${selected.x}%;top:${selected.y}%;width:${selected.w}%;height:${selected.h}%`} aria-hidden="true">
            <span class="part-focus-pulse"></span>
            <span class="part-focus-outline"></span>
            <strong class="part-focus-label">{selected.label}</strong>
          </div>
        {/key}
      {/if}
    </div>

    {#if mode==='parts'}
      <div class="badge"><b>BIG BICYCLE</b><span>Tap a word below — that bicycle part will flash</span></div>
    {:else if mode==='meet'||mode==='sounds'}
      <button class="bell" type="button" onclick={()=>bellRun++}>🔔 Tap the bell</button>
      {#key bellRun}{#if bellRun}<strong class="ring" aria-live="polite">RING!</strong>{/if}{/key}
    {:else if mode==='magic'}
      <p class="mode-note">☁ ✦ {magicPlace||'Where would your magic bicycle go?'} ✦ ☾</p>
    {:else if mode==='reading'}
      <p class="mode-note">1 · Helmet → 2 · Brakes → 3 · Pedal</p>
    {:else if mode==='safety'}
      <p class="mode-note">{safetyMask===7?'✓ Ready to ride!':'🪖 Check before the ride'}</p>
    {/if}
  </div>

  {#if mode==='parts'}
    <div class="part-choices" aria-label="Seven bicycle part labels">{#each parts as part}<button type="button" aria-pressed={selectedPart===part.id} onclick={()=>{selectedPart=part.id;focusRun++}}>{part.label}</button>{/each}</div>
    <p class="part-found" aria-live="polite"><b>{selected.label}</b> · Look at the bright flashing part above.</p>
  {:else if mode==='magic'}
    <div class="magic-choices" aria-label="Choose a magic bicycle destination">{#each magicPlaces as place}<button type="button" aria-pressed={magicPlace===place} onclick={()=>magicPlace=place}>{place}</button>{/each}</div>
    <p aria-live="polite">{magicPlace?`Your bicycle is heading to ${magicPlace}. What do you notice there?`:'No score here. Pick a place or invent a different one.'}</p>
  {:else if mode==='safety'}
    <div class="safety-choices" aria-label="Pre-ride checks">{#each safetyItems as item,index}<button type="button" aria-pressed={Boolean(safetyMask&(1<<index))} onclick={()=>safetyMask|=1<<index}>{item}</button>{/each}</div>
    <p aria-live="polite">{safetyMask===7?'Helmet, brakes and tyres checked. Ready.':'Tap each check before the bicycle moves.'}</p>
  {/if}
</section>
