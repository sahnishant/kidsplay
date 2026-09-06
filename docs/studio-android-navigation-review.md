# STUDIO-04 Z — visible Android navigation targets

Follow-up to A–X and the Y submitted-work review; **26 implementation/review work packages**. #264 owns current-head verification.

The first packaged studio run at `7cfc8c1` stopped before opening the studio. Its retained `ui.xml` showed Open Learn About in the practice list with bounds `[0,0][0,0]`; the inherited tap helper treated that as a valid coordinate and tapped the screen corner. This failure is retained in run 33986288586 / artifact 9975347939.

The shared helper now rejects disabled and zero/tiny visible bounds. Scrolling is explicit opt-in: existing Stories calls keep their previous no-scroll behaviour; studio navigation requests bounded normal portrait swipes to reveal a real target. There are no hidden DOM clicks, answer injection, or writes into app storage from the native proof.

This repairs the test's navigation, not a claim that the studio relaunch test has passed. Native Back, force-stop/relaunch, exact saved demonstration step and rotation still have to pass on the resulting commit.
