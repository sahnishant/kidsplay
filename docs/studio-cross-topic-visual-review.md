# Cross-topic screenshot review and regression fixes

Issue #264, draft PR #263. These are TOPIC-17–19, additional to the first sixteen cross-topic work packages. They do not add games or claim child approval.

## TOPIC-17 — factual-card guard must not match launcher copy

Browser run 33990161846 at `5856827` ran the new cross-topic journeys and captured their screenshots, but failed the pre-existing Fire Station guard. `getByText('TRY IT')` matched the launcher's lowercase `Explore · show me · try it` copy by case-insensitive substring. The corrected guard scopes all four forbidden factual families to actual `.card > small` labels and separately requires the story launcher. No unsupported factual-card allowance is added.

## TOPIC-18 — plant demonstration overlaps its label

The captured Young plant illustration extended into the label. An inline span's requested height was not a reliable frame for the entity's nested SVG. The shared sequence demonstration now supplies an explicit block frame and block-sized presenter/item spans. A new browser test checks all three plant stages, SVG bounds and label separation. This is shared presentation work, not a plant-only renderer or imported artwork.

## TOPIC-19 — feedback below long story cards

At 360×640, the four story cards placed the feedback below the initial visible area. The shared studio now keeps evaluated feedback and Change my answer outside the scrolling work area in a bounded top region. The child's actual submitted work remains available below; there is no fullscreen splash or timed transition. A browser test verifies feedback/retry visibility and continued editing.

Observed final-head results and proof artifacts are maintained in #264. Existing tests are retained. These findings show why a passing interaction assertion does not replace visual inspection. The source/model/evaluator, saved state, scope and practice-only evidence boundaries are unchanged by these fixes.
