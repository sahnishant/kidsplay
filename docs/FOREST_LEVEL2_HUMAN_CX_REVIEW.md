# HUMAN REVIEW — Forest Explorer Level 2 visual/CX acceptance

**Status: RE-REVIEW REQUIRED.**

The prior 2026-09-04 approval was bound to `main` at `1cb205a0ff09f2be684eecf1f05d6cc370bf6761`. It remains historical evidence for that exact build only.

On **2026-09-06**, the human product owner explicitly rejected the current Quiet Creek presentation as visually weak and sloppy, specifically calling out the lack of meaningful visuals. That later product decision supersedes the earlier visual/CX approval for future builds. Automation must not treat the old approval as acceptance of the redesign.

Current redesign branch: `fix/quiet-creek-visual-rescue`.

## Required redesign

The child-facing mission must stop presenting the creek as status/debug cards plus text controls. The mission should read as one place that the child changes.

Required product shape:

1. **One persistent illustrated creek scene** occupies most of the phone surface.
   - visible shallow creek;
   - visibly broken wooden crossing;
   - missing plank and side rail;
   - fallen branch/blockage in the water;
   - visible side channel;
   - visibly drooping creek-bank saplings;
   - Dheu and Scientu visibly participate in the scene.
2. **Compact HUD only**: Back, title and `1/4` progress. No permanent `WORLD PROBLEM` panel.
3. **Bridge repair is physical/visual**: illustrated plank and rail pieces go into glowing gaps on the actual bridge. Select-then-place remains an accessibility path; direct pointer drag may use the same assembly contract.
4. **Water-path work is physical/visual**: channel pieces connect visibly in the scene rather than matching text labels in two columns.
5. **Cause/effect happens in the world**: the visible blockage is removed, water visibly flows, and the child can see the changed creek.
6. **Plant recovery is visible**: dry saplings visibly lift/green after watering, with a small returning-life payoff such as frog/butterfly activity.
7. **Completion stays in the same scene**: do not replace the world with a technical completion/debug page. No child-facing text about saved progress stores, reward farming, implementation policy or persistence internals.
8. Existing evidence boundaries remain unchanged:
   - G2 assembly authority remains shared;
   - wrong-first placement preserves first-attempt evidence;
   - no redundant `Check Answer`;
   - no new evaluator or duplicate progress store;
   - persistence is still projected from canonical story progress.

## Fresh human acceptance journey

Review the exact redesign head only after automated Windows, Browser and Android checks are green.

1. Enter Forest Level 2 at **360 × 640** and confirm the creek/bridge/branch/plants are understandable before reading prose.
2. Confirm the illustrated world gets substantially more screen area than instructions/chrome.
3. Deliberately put the plank in the rail target. Retry must remain local, gentle and preserve correct work.
4. Place the plank and rail. The repaired pieces must visibly become part of the bridge.
5. Complete the water-path work. The connected path must be visible without relying on labels such as `slot.channel-upper`.
6. Complete plant care and blockage removal. The child must see the scene change rather than receive only a success sentence.
7. Confirm completion remains a restored creek scene and contains no engineering/debug copy.
8. Repeat with sound off and reduced motion; all required meaning must remain visible.
9. Repeat on packaged Android offline, including force-stop/relaunch and portrait → landscape → portrait.
10. Return/relaunch and confirm the persistent Forest consequence and bounded discoveries remain correct.

## Acceptance record

- Reviewer: Human product owner
- Redesign branch: `fix/quiet-creek-visual-rescue`
- Exact reviewed SHA: **PENDING**
- Browser 360 × 640: **PENDING**
- Touch accessibility: **PENDING**
- Reduced motion: **PENDING**
- Sound off: **PENDING**
- Android offline/relaunch/rotation: **PENDING**
- Overall Forest L2 visual/CX gate: **PENDING**
- Rejection source: human product-owner review on 2026-09-06; current pre-redesign screen rejected for inadequate visuals/sloppy presentation
