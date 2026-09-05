# TOPIC-21 — fix intrinsic SVG sizing, not clipping

The new plant bounds test failed in Browser run33990755621 at `2f44b7f`. The frame was130px high but the Seed SVG extended below it; overflow:hidden merely clipped the seed. The test was retained unchanged.

Inspection of the actual trace identified an `entities` presenter with nested block spans and a `visual-entity` inline grid. A local Chromium reproduction using the trace's real markup/CSS measured the frame at180x130 but the grid's intrinsic child/SVG at180x150. Changing only the framed entity to block layout made the child and SVG180x130. This reproduction explains the cause; it is not a substitute for the final production CI run.

The studio demonstration now applies block layout only to visual entities inside its illustration frame. It removes clipping and adds8px internal breathing room for decorative motion. Global entity behavior, scientific content, evaluator and workspace semantics are unchanged. The existing three-stage SVG bounds/label separation test must pass without increasing its1px tolerance. The separate story-feedback visibility test remains.

Final exact-head workflow/artifact evidence is recorded in #264. The cross-topic tranche now contains21 focused implementation/review work packages in11 commits; six new child-facing activities, twenty total consumers. No extra activity, release certification or human approval is counted for this fix.
