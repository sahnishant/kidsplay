# Cross-topic studio pilots — #264 / #263

The user's explicit request to work across topics permits these bounded **draft** pilots while STUDIO-04 physical-device, child, editorial and narration acceptance stays open. It does not grant a merge or approval of source adaptations. `main` remains canonical. The exact current-head CI and artifact evidence lives in issue #264.

## Six new consumers; twenty total unique activities

| Destination (all new pilots D2+) | Activity | Authoritative source |
|---|---|---|
| Earth / Day and Night | From sunrise to midnight | `knowledge.earth.process.day-sequence.001`, new source-informed draft process |
| Earth / Water can change | When ice melts | Existing `knowledge.science.process.melt-ice.001` |
| Earth / Water can change | When water freezes | Existing `knowledge.science.process.freeze-water.001` |
| Lion / Lion family | A lion grows up | `knowledge.animals.process.lion-growth.001`, new source-informed draft process |
| Fire Station / Fire engine | Dheu visits the fire station | Original `story.studio.fire-station-visit`, a non-assessing StoryManifest |
| Plants / A seed begins to grow | From seed to young plant | Existing `knowledge.science.process.germination.001` |

Plants is a new Learn About navigation home for existing plant content, not an already-existing Learn About tile. Original Earth/Lion/Fire Station introductory depth is unchanged. Reading, factual topic cards, discussion and practical activities remain; not every chapter segment is a game.

## Reuse and meaning

All six use **the existing sequence_order@1 and central evaluator**. No new evaluator, progress database, audio player or per-topic screen. Process recipes reference canonical process units and inherit neither independent mastery nor adaptation approval. The process compiler keeps legacy recipes unchanged and emits new practice-only studio adaptations as draft.

The story is stored using the existing StoryManifest contract, outside the published Stories candidate pack. Its beats are non-assessing and have no embedded questions. A bounded build-time projection derives cards and order into a separate generated output, with empty assessed knowledgeRefs and story-local provenance. It does not promote story events into shared truths or introduce another story engine. Show me reads the source one page at a time; no correct answer is needed to reach its ending. Text/read-together support is present; supported-mode metadata is not proof of produced narration.

Every sequence displays its contextual prompt in Explore, Show me and Try it. Incorrect feedback comes from the source-backed activity contract. Fraction diagnostics remain quantity-based. Context, source text and task revisions participate in existing workspace compatibility checks; reading/restoring does not submit or refresh mastery.

## Source checks and remaining editorial work

- Earth day source check: Lunar and Planetary Institute, **Spin! Day and Night**, Part A: https://www.lpi.usra.edu/education/explore/marvelMoon/activities/whatIf/spin/ . The activity anchors sunrise to the following midnight at a place/date with sunrise and sunset. It does not teach fixed clock hours, equal day/night duration or certify understanding of rotation.
- Lion source check: Smithsonian National Zoo, **Lion**, social structure and development: https://nationalzoo.si.edu/animals/lion . Cub/subadult/adult are an ordered growth-stage selection, conditional on reaching adulthood. No exact ages, universal mane cue or hunting milestone is assessed.
- Water and plant stages reuse checked-in canonical records without adding explanations not stored there. The seed task says a seed that is beginning to grow, not every seed.
- Fire Station story is independently authored fiction about a supervised visit. It is not a universal visit schedule, fire-response procedure or safety certification.

Source checks are not HUMAN editorial approvals. Day and lion pilots currently use explicit stage labels; distinguishing illustrations remain a gate. Water and plant tasks consume the existing semantic visuals. Final narration and physical/real-child acceptance remain open for all new pilots.

## Focused passes

| Pass | Change |
|---|---|
| TOPIC-01 | Practice-only policy through shared process compilation |
| TOPIC-02–04 | Anchored Earth day, melting and freezing consumers and placements |
| TOPIC-05–06 | Lion growth source, scope and six-permutation checks |
| TOPIC-07 | Correct Node/Vitest boundary; test actual compiled outputs |
| TOPIC-08–09 | Original non-assessing story and reusable source-local projection |
| TOPIC-10–11 | Plants topic home, source reuse and cross-topic workspace isolation |
| TOPIC-12–14 | Always-visible context, adaptation-review boundary, eight new browser journeys |
| TOPIC-15 | Story no-assessment admission and source-text-change invalidation |
| TOPIC-16 | Explicit story-data budget and review record |

These are focused work packages, not sixteen independently accepted releases or new engines.

## Verification commands

`npm run check` runs compiler, content, type, bundle and full behavior checks. The cross-topic behavior suite enumerates **64 total permutations across the six tasks** (24 + 2 + 2 + 6 + 24 + 6), with exactly one source order per task and zero mastery/knowledge evidence. Projection tests separately reject invalid sources, embedded assessment, duplicate or indistinguishable beats, and stale source text. The all-consumer workspace suite grows with the registry.

`npx playwright test e2e/studio-cross-topics.spec.ts` runs eight new journeys: six teach/practice/reload cases; distinct water contexts and retry; introductory-depth isolation. They use touch, keyboard, actual navigation and saved workspace reads, not injected answers. Capture prefix `studio-*.png` uses the existing proof artifact upload. Passing scripts alone do not establish readability; inspect their screenshots.

Existing nine studio browser journeys and native fraction/Stories recovery remain regressions. They are **not dedicated native acceptance for every new topic**. Record observed results on the exact head, not a prior commit.

## Performance

No installed/core/renderer/CSS budget increase for this tranche. The new generated story data has its own **4 KiB raw / 1.5 KiB gzip** ceiling. It is compiled at build time; the projector is not shipped as a client evaluator.
