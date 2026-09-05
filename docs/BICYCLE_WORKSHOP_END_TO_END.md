# Bicycle Workshop — end-to-end Class II English companion

Parent architecture: #254. Pilot/source-control issue: #256. Implementation PR: #257.

## Product identity

**Bicycle Workshop** is an independently authored Kidsplay curriculum companion. It is not a digital edition, adaptation, translation, or replacement for NCERT's chapter *My Bicycle*.

The source chapter is used only to identify broad curriculum topics and skills. Runtime wording, questions, explanations, semantic relations, activity sequencing, graphics, animation compositions, and feedback are independently authored.

## Rights posture

The runtime does not rely on fair dealing as its commercial publication basis. It includes no:

- poem line or complete poem;
- copied exercise wording;
- source definition;
- page image or scan;
- source illustration;
- source page layout;
- source narration;
- NCERT mark, page furniture, or textbook character.

Common functional terms such as **bicycle**, **wheel**, **pedal**, **brake**, **bell**, **helmet**, **a**, and **an** remain usable as ordinary language and factual vocabulary. The expressions built around them are newly written.

## AI visual rule

Textbook images are never supplied to the image generator. The artwork pipeline is graph-only:

```text
Learning Graph claim
      ↓
semantic visual brief
      ↓
original Kidsplay vector/composition
      ↓
similarity and accessibility review
```

Tracing, image-to-image transformation, pose matching, layout matching, palette matching, source-style imitation, and source branding are prohibited. The current slice uses original Kidsplay semantic bicycle/helmet vectors and new compositions; it uses no source pixels.

## Learning Graph

The runtime admits 29 stable graph claims spanning:

- bicycle identity and human power;
- core and optional parts;
- pedal-to-wheel movement chain;
- brake-to-slowing chain;
- steering;
- bell signalling;
- helmet, brake, and tyre pre-ride checks;
- noun/verb senses of **pedal** and **brake**;
- bicycle, handlebar, tyre, and bell vocabulary.

The wider chapter graph also records frame, fork, rim, spokes, hub, tube, crank, chain, sprocket, brake lever, grip, kickstand, light, and reflector concepts for future depth without forcing them into every Class II session.

## Child delivery

A new free catalogue entry launches through the existing generic session:

```text
Play
  → Bicycle Workshop — Class 2 English
  → 8-question adaptive session
  → existing evaluator
  → existing honest retry flow
  → existing canonical progress store
```

There is no chapter-specific evaluator, score store, currency, or runtime LLM.

The 28-question bank spans six existing engines:

- visual single choice;
- word-bank completion;
- drag-and-match;
- causal sequencing;
- memory pairs;
- word search.

## Evidence boundaries

- Part/function and safety questions can update exact graph-claim evidence.
- Phonics and grammar update their capability concepts without granting bicycle-fact mastery.
- Chapter-local poem claims are never runtime mastery targets.
- Merely viewing graphics or animations does not create mastery.

## Validation

```bash
node scripts/learning-graph/validate-bicycle-workshop-production.mjs
npx vitest run tests/bicycle-workshop-production.behavior.test.ts
npm run check
```

The production validator enforces independent-expression and AI-art boundaries, graph size and claim resolution, exact claim-ID compatibility projection, pack/question completeness, six activity families, no chapter-local claim leakage, scene/animation/visual resolution, and offline canonical evaluator/progress integration.

## Human gates

Engineering can be complete while the following remain human release gates:

- final editorial review of child wording;
- final visual-similarity review;
- linguistic review of short-a examples in the intended accent range;
- child usability review;
- legal review if the product scope later expands to displaying or narrating protected textbook expression.
