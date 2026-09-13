# NAV100-01 Capability Matrix

Issue: [#285](https://github.com/sahnishant/kidsplay/issues/285)
Repository baseline: `0e719263c676154e5573ff7a4b98be509044b1df`
Planning pack inspected: PR #295 head `bdbff0ffaae31509cb0c84be535ee195aed9c7c9`

This matrix records what the current repository can actually support for NAV100 discovery work. It is **not** a proposed Home taxonomy and is not permission to add or promote content.

## Status key

- **LIVE** — current implementation is wired/reachable and has an existing verification path.
- **PARTIAL** — an implementation exists, but an important part of the claimed capability is absent or not generically wired.
- **MISSING** — no exact implementation/authority was found in the inspected current registries/runtime.
- **UNVERIFIED** — code may exist, but the inspected evidence is insufficient to claim live behavior.

All test links below are existing repository evidence. **They were not freshly run by NAV100-01.**

## 1. System capability matrix

| Capability / layer | Kind | Exact current owner / symbol | Status | Existing verification | NAV100 consequence / gap |
| --- | --- | --- | --- | --- | --- |
| Single-choice questions | Question engine | `single_choice@1` in [`content/engines/manifest.json`](../../content/engines/manifest.json); `getEngineComponent()` in [`engineRegistry.ts`](../../src/runtime/engineRegistry.ts) | LIVE | [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Reusable evaluator family; not a navigation category. |
| Word-bank fill | Question engine | `word_bank_fill@1` | LIVE | [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Same. |
| Drag-to-target | Question engine | `drag_to_target@1` | LIVE | [`tests/drag-to-target-input.behavior.test.ts`](../../tests/drag-to-target-input.behavior.test.ts), [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Supports digital manipulation; does not by itself imply a real-world practical/sensory action. |
| Collection/count grouping | Question engine | `collection_count@1` | LIVE | [`tests/learning-studios.behavior.test.ts`](../../tests/learning-studios.behavior.test.ts) | Cardinality grouping, **not** a survey/data-table engine. |
| Equal parts | Question engine/model | `equal_parts@1`; `src/mechanics/equalParts.mjs` | LIVE | [`tests/equal-parts.behavior.test.ts`](../../tests/equal-parts.behavior.test.ts), [`tests/equal-parts.presentation.test.ts`](../../tests/equal-parts.presentation.test.ts) | Good reusable fraction-sharing model. |
| Sequence ordering | Question engine | `sequence_order@1/@2` | LIVE | [`tests/visual-engine-expansion.behavior.test.ts`](../../tests/visual-engine-expansion.behavior.test.ts), [`tests/learning-studios.behavior.test.ts`](../../tests/learning-studios.behavior.test.ts) | Ordering/prerequisite model; not folding geometry or general turn-state. |
| Memory pairs | Question engine | `memory_pairs@1` | LIVE | [`tests/visual-engine-expansion.behavior.test.ts`](../../tests/visual-engine-expansion.behavior.test.ts), [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Reusable practice family. |
| Word search | Question engine | `word_search@1` | LIVE | [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Word puzzle engine, not a broad “Word World” product boundary by itself. |
| Hotspot | Question engine | `hotspot@1` | LIVE | [`tests/visual-engine-expansion.behavior.test.ts`](../../tests/visual-engine-expansion.behavior.test.ts), [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Visual selection engine. |
| Trace path | Question engine/mechanics | `trace_path@1`; `src/mechanics/tracePath.ts` | LIVE | [`tests/trace-path.behavior.test.ts`](../../tests/trace-path.behavior.test.ts), [`e2e/trace-path.spec.ts`](../../e2e/trace-path.spec.ts) | Physical-motor-like pointer task, but still digital tracing. |
| Crossword | Compiled question engine | `crossword@1` | LIVE | [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Reusable puzzle engine. |
| Maze | Compiled question engine | `maze_path@1` | LIVE | [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts) | Reusable puzzle engine. |
| Experience recipes | Presentation recipe | [`content/experience/recipes.json`](../../content/experience/recipes.json), `resolveExperienceRecipe()` | LIVE | [`tests/experience-recipes.behavior.test.ts`](../../tests/experience-recipes.behavior.test.ts) | Choreography only. Registry rejects answer/question authority and suppresses pre-answer assessment. Never describe a recipe as a simulation engine. |
| Reusable Learning Studios | Reusable authored-model projection | [`content/experience/learning-studios.json`](../../content/experience/learning-studios.json), `LEARNING_STUDIO_ACTIVITIES`, `StudioLauncher` | LIVE | [`tests/learning-studios.behavior.test.ts`](../../tests/learning-studios.behavior.test.ts), [`e2e/learning-studios.spec.ts`](../../e2e/learning-studios.spec.ts) | Stable `studio.*` identity already supports reuse across topic/workshop placement. Guided studio questions become `practice_only`. |
| Studio partial-work resume | Navigation/workspace persistence | `createStudioWorkStore()` in [`studioWorkStore.mjs`](../../src/runtime/studioWorkStore.mjs) | LIVE | [`tests/learning-studios.behavior.test.ts`](../../tests/learning-studios.behavior.test.ts), [`tests/studio-workspace-core.behavior.test.ts`](../../tests/studio-workspace-core.behavior.test.ts) | Can truthfully resume a supported studio workspace. Do not convert this into mastery/completion. |
| Learn About topic catalogue/runtime | Authored topic experience | `LEARN_ABOUT_TOPICS` in [`learnAboutCatalog.ts`](../../src/experience/learnAboutCatalog.ts); Learn About runtime/view | LIVE | [`tests/learn-about-v1-production.behavior.test.ts`](../../tests/learn-about-v1-production.behavior.test.ts), [`e2e/learn-about-v1.spec.ts`](../../e2e/learn-about-v1.spec.ts) | Existing topic-first system. D0 exploration is non-evaluative; deeper evaluated cards reuse reviewed questions. |
| “Knowledge Journey” named runtime/surface | Discovery/product label | No literal registered path/symbol/ID found in inspected repository | MISSING | none | Must be a G1 design decision, not reported as an existing capability. Existing Learn About may be reused only if product owner chooses that relationship. |
| Bicycle Workshop guided experience | Substantial authored experience | `BicycleWorkshopViewport`; module ID `curriculum-companion.ncert-class2-english.bicycle-workshop.v1` | LIVE | [`tests/bicycle-workshop-production.behavior.test.ts`](../../tests/bicycle-workshop-production.behavior.test.ts), [`e2e/bicycle-workshop.spec.ts`](../../e2e/bicycle-workshop.spec.ts) | Strong NAV100 pilot. Guided experience is manually wired and intentionally excluded from eager global catalogue. |
| Bicycle practice/chapter check | Authored session projections | `free.english.bicycle-workshop.1`; `free.english.bicycle-workshop.chapter-check.1`; `createBicycleWorkshopSession()` | LIVE | [`tests/bicycle-workshop-production.behavior.test.ts`](../../tests/bicycle-workshop-production.behavior.test.ts) | Existing IDs can be referenced; do not invent a new answer bank. |
| Bicycle guided exact resume | Experience checkpoint | `part`/`idea` are component-local in `BicycleWorkshopViewport` | MISSING | no persistence contract found | Reopen is possible; exact guided position resume must not be claimed. |
| Sound-first phonics trail | Authored literacy experience | `SOUND_TRAIL_ADVENTURE_ID = phonics.sound-trail.v1`; `PhonicsAdventureViewport` | LIVE | [`tests/sound-first-literacy-production.behavior.test.ts`](../../tests/sound-first-literacy-production.behavior.test.ts), [`e2e/phonics-sound-trail.spec.ts`](../../e2e/phonics-sound-trail.spec.ts) | Strong words/phonics pilot. Uses its own validated phoneme/grapheme mappings and existing evaluator. |
| Sound Trail exact checkpoint resume | Experience checkpoint | no durable current-stage state in `PhonicsAdventureViewport` | MISSING | none | Completed recognition attempts persist as evidence/discovery, but navigation cannot promise exact resume. |
| Reviewed vocabulary pack | Learning-pack experience | `free.english-vocabulary.foundation.1` in [`content/packs/free-vocabulary.json`](../../content/packs/free-vocabulary.json) | LIVE | [`tests/primary-vocabulary-corpus.behavior.test.ts`](../../tests/primary-vocabulary-corpus.behavior.test.ts), [`tests/content.behavior.test.ts`](../../tests/content.behavior.test.ts) | Current Play catalogue can launch it through generic pack path. Lexicon/editorial authority remains separate. |
| Primary Stories library | Authored reading/listening experience | `StoriesViewport`; four approved story IDs | LIVE | [`tests/story-v1-catalog.behavior.test.ts`](../../tests/story-v1-catalog.behavior.test.ts), [`e2e/stories-resume.spec.ts`](../../e2e/stories-resume.spec.ts) | First-class non-quiz pilot. Manifests specify `assessmentPolicy: none`, `masteryWritesAllowed: false`. |
| Story exact reading resume/favourite | Experience checkpoint | `storyReadingPersistence.ts` | LIVE | [`tests/story-v1-catalog.behavior.test.ts`](../../tests/story-v1-catalog.behavior.test.ts), [`e2e/stories-resume.spec.ts`](../../e2e/stories-resume.spec.ts) | Truthful `Continue` supported for Stories. |
| Story-world map/mission progression | Authored world experience | `content/story/locations.json`, `content/story/missions.json`, `StoryWorldViewport` | LIVE | [`tests/storyProgress.behavior.test.ts`](../../tests/storyProgress.behavior.test.ts), [`e2e/child-journeys.spec.ts`](../../e2e/child-journeys.spec.ts) | Stable location/mission IDs; map level/stars are story progression, not mastery. |
| Practical world actions | Reusable practical/action model + authored experiences | `worldActionContract.ts`, `worldDepthRegistry.ts`, Forest/Town depth data/practical viewports | LIVE | [`tests/world-action-contract.behavior.test.ts`](../../tests/world-action-contract.behavior.test.ts), [`tests/world-mission-practical-motion.behavior.test.ts`](../../tests/world-mission-practical-motion.behavior.test.ts) | Strong world-action pilot. Preserve `exploration` / `guided_practice` / `evaluative` distinctions. |
| Incomplete world-action step resume | Experience checkpoint | practical viewport step/assembly/drag state is local; `storyProgress` records completed mission/location | MISSING | no durable partial-step checkpoint found | Reopen can restart safely; exact incomplete mission position must not be advertised. |
| Discovery Book | Read-only discovery projection | `DISCOVERY_BOOK_COLLECTIONS`, `buildDheuDiscoveryBook` in [`discoveryBookProduction.ts`](../../src/experience/discoveryBookProduction.ts) | LIVE | [`tests/discovery-book-production.behavior.test.ts`](../../tests/discovery-book-production.behavior.test.ts), [`e2e/discovery-book.spec.ts`](../../e2e/discovery-book.spec.ts) | Can surface things already discovered. It is not the missing catalogue for 100+ playable experiences. |
| Canonical attempt/mastery evidence | Evidence/progress owner | `evaluate()` + `recordAttempt()` / `kidsplay.progress.v1` | LIVE | [`tests/evaluation.behavior.test.ts`](../../tests/evaluation.behavior.test.ts), [`tests/progress.behavior.test.ts`](../../tests/progress.behavior.test.ts) | Navigation/watch/open/reopen must never create evidence. `practice_only` suppresses both knowledge and mastery evidence. |
| Story completion/unlock persistence | World progress owner | `storyProgress.ts` / `kidsplay.story-progress.v1` | LIVE | [`tests/storyProgress.behavior.test.ts`](../../tests/storyProgress.behavior.test.ts), [`tests/world-rewards.behavior.test.ts`](../../tests/world-rewards.behavior.test.ts) | Separate authority from knowledge mastery. |
| Generic free-session exact resume | Session persistence | App only calls `saveMockCheckpoint()` for `goal_pattern_mock` | MISSING | [`tests/mock-persistence.behavior.test.ts`](../../tests/mock-persistence.behavior.test.ts), [`tests/mock-resume-integrity.behavior.test.ts`](../../tests/mock-resume-integrity.behavior.test.ts) cover structured mock only | NAV100 must not display universal “Resume” semantics. |
| Structured long-mock resume | Session checkpoint | `mockPersistence.ts`, `App.svelte::handleCheckpoint()/resumeMock()` | LIVE | [`tests/mock-persistence.behavior.test.ts`](../../tests/mock-persistence.behavior.test.ts), [`tests/mock-resume-integrity.behavior.test.ts`](../../tests/mock-resume-integrity.behavior.test.ts) | Existing type-specific exact checkpoint contract. |
| Browser/Escape/native Back layers | Navigation runtime | `installAppBackNavigation`, `pushAppBackLayer`, `enterAppSessionLayer`, `requestAppBack` | LIVE | [`tests/app-navigation.behavior.test.ts`](../../tests/app-navigation.behavior.test.ts), [`tests/native-app-back.behavior.test.ts`](../../tests/native-app-back.behavior.test.ts), [`e2e/play-nested-navigation.spec.ts`](../../e2e/play-nested-navigation.spec.ts) | Mandatory integration seam. New router/back stack would duplicate authority. |
| Bundled/offline child audio with fallback | Audio runtime | `childAudio.ts`, `KIDSPLAY_CHILD_AUDIO_MANIFEST`, `playChildUtterance()` | LIVE for approved entries; PARTIAL by authored surface | [`tests/required-bundled-audio.behavior.test.ts`](../../tests/required-bundled-audio.behavior.test.ts), [`tests/bundled-voice-stories-v1.behavior.test.ts`](../../tests/bundled-voice-stories-v1.behavior.test.ts) | Asset presence != HUMAN approval. Sound Trail `/f/` and `/s/` remain `candidate_pending_human`. Text fallback is required. |
| Session-limit policy | Parent/session policy | `sessionLimitPolicy.ts` | PARTIAL / UNVERIFIED live wiring | [`tests/session-limit-policy.behavior.test.ts`](../../tests/session-limit-policy.behavior.test.ts) | Isolated policy is real; inspected `App.svelte` does not wire it into general launch flow. Later acceptance must find/own the actual integration instead of assuming enforcement. |
| General authored-experience discovery catalogue | Discovery/navigation projection | none across current authored systems | MISSING | none | Core NAV100-03 gap: build a **read-only projection**, not a new truth registry. |
| Direct child entry to arbitrary `studio.*` activity | Discovery entry | current `StudioLauncher` is contextual through topic/workshop bindings | MISSING as a general direct entry | existing studio tests cover contextual launch | Later G1 can approve direct discovery while retaining same `studio.*` identity. |
| Survey/data-collection model | Reusable learning model | none found in engine/studio registries | MISSING | none | `collection_count` is not equivalent. Personal-preference capture needs privacy/non-scoring design. |
| Folding/symmetry geometry model | Reusable learning model | none found | MISSING | none | `sequence_order`/animation are not a geometry folding state model. |
| Multi-turn NIM/strategy engine | Game-state model | none found | MISSING | none | Do not reskin as single-choice. |
| Physical sensory/experiment evidence model | Real-world activity/evidence contract | none found | MISSING | none | Digital world action/animation may rehearse instructions but cannot prove touch/temperature/bounce/real observation. |
| Free-form personal reflection response | Non-scored authored-response model | none found in question/studio contracts | MISSING | none | Can remain non-stored discussion. Any stored personal/family response requires privacy/product authority. |

## 2. Six real pilot candidates grounded in current runtime

These are **audit candidates for G1**, not an approved pilot set. Every ID below exists now; where the requested direct entry or checkpoint is absent, that absence is explicit.

| Pilot form | Existing current identity | Current launch route | Checkpoint / completion truth | Evidence truth | Existing verification |
| --- | --- | --- | --- | --- | --- |
| **1. Substantial authored game/learning experience — Bicycle Workshop** | Module `curriculum-companion.ncert-class2-english.bicycle-workshop.v1`; practice `free.english.bicycle-workshop.1`; chapter check `free.english.bicycle-workshop.chapter-check.1` | Home Play -> manual Bicycle nested surface; practice/check -> App `startSession()` | Guided section/idea position **not persisted**. Submitted practice outcomes persist. | Questions follow existing evaluator; some workshop/studio practice is explicitly `practice_only`; capability evidence remains distinct from bicycle fact mastery | [`tests/bicycle-workshop-production.behavior.test.ts`](../../tests/bicycle-workshop-production.behavior.test.ts), [`e2e/bicycle-workshop.spec.ts`](../../e2e/bicycle-workshop.spec.ts) |
| **2. Topic learning — Earth in Learn About** | `learn.earth` | Home Play -> Learn About -> Earth topic | Topic/depth/section browsing position **not persisted**; nested studio work may persist separately | D0 explore has `evidenceMode: none`; factual cards use reviewed knowledge; evaluated practice reuses existing reviewed questions | [`tests/learn-about-v1-production.behavior.test.ts`](../../tests/learn-about-v1-production.behavior.test.ts), [`e2e/learn-about-v1.spec.ts`](../../e2e/learn-about-v1.spec.ts) |
| **3. Manipulable Learning Studio — Equal Shares** | `studio.fractions.equal-shares` | Current registered context: `learn.fractions` section binding -> `StudioLauncher` | Activity workspace resume **is supported** by `studioWorkStore`; general Home-direct studio discovery is **missing** | Studio converts source question to `evidencePolicy: practice_only`; evaluation can give feedback but emits no knowledge/mastery evidence | [`tests/learning-studios.behavior.test.ts`](../../tests/learning-studios.behavior.test.ts), [`e2e/learning-studios.spec.ts`](../../e2e/learning-studios.spec.ts) |
| **4. Words/phonics — Scientu's Sound Trail** | `phonics.sound-trail.v1` | Home Play -> manual Sound Trail nested surface | Exact current sound/stage **not persisted**. Attempts persist; discovery projects after correct recognition of all three sounds | Existing questions write their authored concept/knowledge evidence; discovery is derived from actual attempts. Audio approval for `/f/` and `/s/` remains pending human review | [`tests/sound-first-literacy-production.behavior.test.ts`](../../tests/sound-first-literacy-production.behavior.test.ts), [`e2e/phonics-sound-trail.spec.ts`](../../e2e/phonics-sound-trail.spec.ts) |
| **5. Primary story/listening — Moonlit Leaf** | `story.dheu.moonlit-leaf` | Home Stories -> Stories library -> story | Exact story + beat + completed + favourite resume **supported** | `assessmentPolicy: none`; `masteryWritesAllowed: false`; story progress is reading state, not mastery | [`tests/story-v1-catalog.behavior.test.ts`](../../tests/story-v1-catalog.behavior.test.ts), [`e2e/stories-resume.spec.ts`](../../e2e/stories-resume.spec.ts) |
| **6. World-action play — Quiet Creek Rescue** | Mission `mission.forest-creek-rescue`; world action `forest.world-depth.l2.creek-rescue` | Home Adventure -> Forest/current mission -> practical world viewport | Completed mission persists; partial bridge/channel/branch/watering step state **not persisted** | World-action definitions retain explicit evidence class/retry policy. A digital drag/action cannot stand in for unrelated physical sensory evidence | [`tests/world-action-contract.behavior.test.ts`](../../tests/world-action-contract.behavior.test.ts), [`tests/world-mission-practical-motion.behavior.test.ts`](../../tests/world-mission-practical-motion.behavior.test.ts), [`e2e/forest-level2.spec.ts`](../../e2e/forest-level2.spec.ts) |

### Pilot-launch caveats for G1

- The guided Bicycle surface has no general catalogue descriptor ID even though its module and nested session IDs are stable. G1 must define which existing identity a discovery descriptor references; #285 does not invent one.
- The Studio pilot is currently context-launched, not a general standalone Home item. A future second entry must still resolve to the same `studio.fractions.equal-shares` activity/workspace identity.
- “Knowledge Journey” is not an existing launch ID. `learn.earth` is the real current topic candidate.
- “Scientu's Lab” exists today as story-world location `scientu-lab`. Reusing the label for a broad studio entrance would need an explicit G1 relationship so it does not create duplicate activity identities.
- Only the Story pilot has a straightforward current exact “Continue where you left off” child-reading contract. Studio workspace resume is also exact within its activity but is not a mastery/completion claim. The other four pilots need weaker truthful reopen wording unless later scoped work adds a checkpoint capability.

## 3. Source and profile capability boundaries

| Authority | Exact registry | Current status model | NAV100-safe use |
| --- | --- | --- | --- |
| Lexicon/source licensing | [`content/lexicon/sources.json`](../../content/lexicon/sources.json) | Per-source allowed uses, adoption state, provenance requirement | Reference source IDs/status only. Do not copy/import text into discovery metadata. |
| Curriculum/alignment sources | [`content/alignment-sources/registry.json`](../../content/alignment-sources/registry.json) | source `type`, `authority`, version/academic year, `status`, notes | Show source-backed mapping only where current profile/membership says so; historical/prototype sources cannot be silently presented as current reviewed coverage. |
| Learning profiles | [`content/learning-profiles/registry.json`](../../content/learning-profiles/registry.json) | `alignmentStatus` includes `reviewed` and `prototype_unverified` | A discovery filter/label may reference a registered profile, but must preserve alignment status and partial coverage. |
| Canonical learning graph | `content/learning-graph/**`, [`docs/CANONICAL_LEARNING_GRAPH_V2.md`](../CANONICAL_LEARNING_GRAPH_V2.md) | canonical nodes/claims/objectives/placements/projections | Navigation stores references only. It must not create a parallel fact/claim/objective store. |
| Question evidence | `Question.knowledgeRefs`, `conceptIds`, `evidencePolicy`; evaluator output | `practice_only` suppresses mastery/knowledge evidence; supporting refs never count as evidence | Discovery/open/watch/replay are not evidence. Same activity reached from two entries cannot double-credit. |

## 4. Availability / offline / loading truth

- Important authored surfaces are already lazy loaded from `App.svelte` or local dispatchers: Learn About, Stories, Bicycle runtime, First Play, Forest/Town practical viewports. A future discovery list should therefore store launch references, not eagerly import every viewport or asset just to render cards.
- Stories read their candidate manifest from the installed app asset path and fail with a usable “could not be opened” state if unavailable.
- Child audio has a deterministic production path for approved bundled utterances and falls back through the existing offline/device/text behavior. Availability and **human approval** are different fields; NAV100 should not infer one from the other.
- The current free learning-pack catalogue is built from repo content; no online search/service is required for core pack discovery.
- No general `availability` contract covering every authored experience was found. NAV100-03 will need to derive conservative read-only availability from existing owners or expose an explicit unsupported state; it must not invent downloadable/online status.

## 5. Missing capability list for coordinator/design decisions

The following are real gaps identified by current source inspection rather than proposals to implement them in #285:

1. One read-only catalogue/projection spanning current authored experiences and pack/topic/studio/story/world identities.
2. A G1-approved relationship between the candidate child labels **Knowledge Journey**, **Scientu's Lab**, existing Learn About, and existing `scientu-lab` story location.
3. Truthful resume semantics per experience type; no universal checkpoint exists.
4. General direct discovery of a registered Learning Studio while preserving the same `studio.*` identity/workspace across contextual entrances.
5. Physical investigation/sensory evidence contract if future source-driven activities require real-world action rather than digital rehearsal.
6. Reusable folding/symmetry state model.
7. Reusable survey/data-recording model with non-scored preference/privacy semantics.
8. Multi-turn strategy/turn-state model for NIM-like play.
9. A reviewed model for free-form personal reflection if responses are ever stored; currently discussion can remain non-scored/no-storage.
10. Verified app-level integration of the existing session-limit policy in the child launch flow.

None of these gaps authorises implementation under #285.

## 6. Fresh-agent handoff checklist

Before NAV100-02 starts, an independent reviewer must accept this audit as G0 in #284. A fresh design agent should then:

- re-fetch current `main`, #1/#284/#286 comments, open PRs, and `WORK_TARGETS.md`;
- use the six real pilot identities above, not placeholders;
- preserve `studio.*`, `learn.*`, story, mission/world-action, module/pack, profile and source IDs as references to their current owners;
- explicitly separate exact resume, workspace resume, outcome persistence, and simple reopen;
- treat the PR #295 PDF source notes as non-canonical unless the underlying source is reproducibly available/registered;
- leave all unanswered architecture/product choices blocked at G1 rather than fabricating APIs or labels.

The NAV100-01 worker does **not** approve G0 or any production change.
