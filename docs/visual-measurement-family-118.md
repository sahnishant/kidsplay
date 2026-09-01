# #118 measurement visual family

Parent: #116 / PR #117  
Grandparent: #76

## Purpose

This is the first primitive-production tranche selected by the fail-closed visual ROI queue. It tests the intended #116 production loop: add a small reusable primitive family once, then let semantic recipes reuse it across generated engines and profiles without per-question mapping.

#117 baseline:

- visual-friendly items: **658/1459 (45.1%)**;
- all supported card/region items including matching: **675/3172 (21.3%)**.

The top ROI group is measurement: temperature, length, mass and capacity.

## Reusable primitives

One generic `measurement-icon` renderer owns four glyphs:

- thermometer;
- ruler;
- balance scale;
- graduated measuring vessel.

The primitives intentionally do **not** own semantic aliases `temperature`, `length`, `mass`, or `capacity`. Those concepts resolve through the recipe layer, preserving surface policy and keeping instrument identity separate from concept semantics.

## Semantic recipes

Four recipes use the shared `measurement` template family:

- `temperature` → thermometer;
- `length` → ruler;
- `mass` → balance scale;
- `capacity` → graduated measuring vessel.

Answer, word-bank and memory surfaces expose instrument identity only. Explanatory annotations are reserved for feedback/teaching surfaces.

## Safety boundaries

- no fuzzy matching;
- no automatic visual for unit strings such as `kg`, `cm`, `mL`;
- no `si-length` recipe merely to increase coverage;
- no question-engine changes;
- no per-question visual mapping;
- no unrelated vocabulary/editorial changes.

## Bundle discipline

SVG paint and stroke attributes live in the glyph markup. The new component has only a minimal width/height rule, so the existing 100 KiB production CSS gate remains unchanged.

## Validation

Final exact-head validation must include:

- `npm run validate:visuals`;
- `npm run validate:visual-recipes`;
- focused measurement-family tests;
- canonical visual coverage and ROI reports;
- full Windows `npm run check`;
- Browser/Playwright child journeys;
- Android APK + packaged offline relaunch/rotation smoke.

The canonical coverage report is authoritative for the final delta.
