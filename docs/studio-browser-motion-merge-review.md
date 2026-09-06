# Studio browser motion setup repair

Integration scope: #263 and #266, following the owner's request to repair failures and merge both branches into main. This is code integration, not editorial, child, physical-device or narration approval; #264 and #265 retain their outstanding gates.

## Observed defect

Browser Smoke 34013131513 at graph head `0d631f64e6efce9cddfd9f98ed960fc8385aca57` ran 86 browser journeys: 71 passed, 15 failed. All failures were the unchanged assertion that reduced-motion scene descendants have `animation-name: none`, across water, Lion, Plants and the final visit beat at three viewports. The contact sheet captured only 8/16 illustrations and is not complete visual proof.

Read-only reproduction 34016209198 checked out that exact head and added diagnostic logging without changing renderer code or assertions. Chromium reported `matchMedia('(prefers-reduced-motion: reduce)').matches === false` in the test named reduce. The compiled stylesheet contained the intended reduced-motion rule; the ice mark instead had the normal finite `ink-arrive` animation. The test name/suite option therefore did not establish the environment being asserted. No particular upstream library defect is inferred from this observation.

## Repair and regression scope

Apply motion emulation explicitly through `page.emulateMedia`, and poll the browser's actual media query before testing the scene. Recheck the media query in every matrix stage and every character timeline stage, and after recovery/offline reopening. Keep all existing geometry, 48px controls, source-label/order, fallback, recovery, evidence, finite-animation and static-SVG assertions intact.

Add a live preference-change regression: the same ice illustration switches normal -> reduced -> normal without altering its source label or learning evidence. Reduced mode must report no running subtree animations. The existing renderer, all illustrations, graph records and bundle caps are unchanged by this repair.

Validation status belongs to exact-head PR/run checkpoints. The failing historical run and diagnostic reproduction are not passing release evidence. Physical-device and real-child/editorial acceptance remain separate.
