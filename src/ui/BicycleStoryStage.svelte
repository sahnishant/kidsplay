<script lang="ts">
  import './bicycleStoryStage.css';
  import bikeUrl from './bicycleStoryBike.svg?url';
  type StoryMode='meet'|'parts'|'mechanics'|'sounds'|'magic'|'reading'|'safety';
  type PartId='seat'|'pedal'|'wheel'|'bell'|'handle'|'carrier'|'brake';
  let { mode }: { mode:StoryMode }=$props();
  const parts:{id:PartId;label:string;x:number;y:number}[]=[
    {id:'seat',label:'Seat',x:39,y:30},{id:'pedal',label:'Pedal',x:47,y:67},{id:'wheel',label:'Wheel',x:72,y:67},
    {id:'bell',label:'Bell',x:67,y:25},{id:'handle',label:'Handle',x:70,y:23},{id:'carrier',label:'Carrier',x:23,y:42},{id:'brake',label:'Brake',x:66,y:45}
  ];
  const magicPlaces=['Cloud garden','Moonlit hill','My own place'] as const;
  const safetyItems=['Helmet','Brakes','Tyres'] as const;
  let selectedPart=$state<PartId>('pedal'),started=$state(false),playing=$state(false),run=$state(0),bellRun=$state(0),magicPlace=$state(''),safetyMask=$state(0);
  let selected=$derived(parts.find((item)=>item.id===selectedPart)??parts[1]);
  function toggle(){if(!started)started=true;playing=!playing||!started}
  function replay(){run++;started=true;playing=true}
</script>

<section class="bike-stage" data-story-mode={mode}>
  <div class:magic={mode==='magic'} class="bike-scene">
    <div class="bike-canvas">
      <img class="bike" src={bikeUrl} alt={mode==='mechanics'?'Large bicycle showing how pedal motion reaches the back wheel':'Large original side-view bicycle'}/>
      {#if mode==='parts'}
        <i class="target" style={`left:${selected.x}%;top:${selected.y}%`} aria-hidden="true"></i>
      {:else if mode==='mechanics'}
        {#key run}<div role="img" class:running={started} class:paused={started&&!playing} class="motion" aria-label="Foot pushes pedal, crank turns, chain travels, back wheel turns, bicycle moves">
          <span class="foot">FOOT<br/>↓ pushes</span><span class="crank">PEDAL<small>CRANK</small></span><span class="chain">CHAIN</span><span class="wheel-spin">BACK WHEEL</span>
        </div>{/key}
      {/if}
    </div>

    {#if mode==='parts'}
      <div class="badge"><b>BIG BICYCLE</b><span>Tap a word below, then find the yellow ring</span></div>
    {:else if mode==='mechanics'}
      <div class="badge"><b>LOOK INSIDE</b><span>Kidsplay extra · no score</span></div>
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
    <div class="part-choices" aria-label="Seven bicycle part labels">{#each parts as part}<button type="button" aria-pressed={selectedPart===part.id} onclick={()=>selectedPart=part.id}>{part.label}</button>{/each}</div>
    <p class="part-found" aria-live="polite"><b>{selected.label}</b> · Find the yellow ring on the bicycle.</p>
  {:else if mode==='mechanics'}
    <div class="controls"><button class="primary" type="button" onclick={toggle}>{started&&playing?'Pause':started?'Continue':'Play slowly'}</button><button type="button" onclick={replay}>Replay</button><span>Pause anywhere and inspect the connection.</span></div>
  {:else if mode==='magic'}
    <div class="magic-choices" aria-label="Choose a magic bicycle destination">{#each magicPlaces as place}<button type="button" aria-pressed={magicPlace===place} onclick={()=>magicPlace=place}>{place}</button>{/each}</div>
    <p aria-live="polite">{magicPlace?`Your bicycle is heading to ${magicPlace}. What do you notice there?`:'No score here. Pick a place or invent a different one.'}</p>
  {:else if mode==='safety'}
    <div class="safety-choices" aria-label="Pre-ride checks">{#each safetyItems as item,index}<button type="button" aria-pressed={Boolean(safetyMask&(1<<index))} onclick={()=>safetyMask|=1<<index}>{item}</button>{/each}</div>
    <p aria-live="polite">{safetyMask===7?'Helmet, brakes and tyres checked. Ready.':'Tap each check before the bicycle moves.'}</p>
  {/if}
</section>
