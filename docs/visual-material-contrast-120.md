# #120 transparent / opaque material contrast family

Parent: #116 / PR #117  
Depends on: #118 / PR #119

## Why this family

The certified #118 ROI queue ranks `opaque` and `transparent` as the next highest reusable production family after measurement:

- opaque: ×10 unresolved instances across memory-pairs and single-choice;
- transparent: ×10 unresolved instances across memory-pairs and single-choice.

Certified #118 baseline: **694/1459 (47.6%)** visual-friendly items.

## Primitive semantics

This tranche deliberately does not teach the concepts as arbitrary object examples such as glass versus wood.

One generic `material-property-icon` renderer owns two samples:

- transparent sample: light rays visibly continue through the material;
- opaque sample: light rays visibly terminate at the material.

The sample primitives do not own direct aliases `transparent` or `opaque`. Those semantic identities resolve through recipes so the surface-exposure policy cannot be bypassed.

## Recipe behavior

Two recipes use the shared `contrast.pair` template family.

On answer/word-bank/memory surfaces:

- transparent exposes only the transparent sample;
- opaque exposes only the opaque sample.

On feedback/teaching surfaces the requested sample may be shown beside the opposite-property sample, with explanatory annotation.

## Safety

- exact authored/direct-semantic precedence remains unchanged;
- no fuzzy substring inference;
- longer explanations such as `Opaque material blocks light` do not gain a visual by label inference;
- the opposite-property contrast is withheld on identity-only answer surfaces;
- no question-engine changes or per-question visual mappings;
- no unrelated shadow/light-source expansion.

## Bundle discipline

SVG paint/stroke values stay in markup. The component adds only the minimal width/height rule, preserving the existing 100 KiB CSS gate.

## Coverage certification gate

The focused material-family test now executes the canonical coverage reporter and requires this tranche to produce:

- **296** registered visual primitives;
- **11** semantic visual recipes;
- **714/1459 (48.9%)** visual-friendly items;
- **105** recipe-resolved item instances.

This is a fail-closed assertion. If the actual canonical report differs, CI must reject the tranche rather than allowing a guessed coverage claim.

## Validation

Final exact head must pass:

- visual + visual-recipe validation;
- focused material-contrast tests including the pinned coverage delta;
- canonical visual coverage and ROI reports;
- Windows `npm run check`;
- Browser/Playwright child journeys;
- Android APK + packaged offline relaunch/rotation smoke.

The certified #118 baseline remains 694/1459; the pinned #120 target is 714/1459.
