# SVG timeline and rendered-ink review

The canonical Dheu persona uses SVG animateTransform in addition to CSS. Removing CSS animation in the story frame was not enough to make a still illustration. The lazy artwork host now pauses only its descendant SVG fragment timelines after mount and after a stage changes. It does not alter the persona, global motion preference or other character consumers. Its deferred tick is cancelled by a lifecycle guard; no running observer, interval or animation loop is introduced.

Two new real-browser journeys cover all four story pages with reduced motion enabled and disabled. They check animationsPaused() and an unchanged SVG clock over two animation frames. The unit test spies on local fragment pause calls and stage updates.

Windows run34007358846 at c60e321 reported982 passing tests and one failure: a newly added arbitrary shape-count threshold expected more than8 primitives in the night scene. This was not an application failure. Replace that arbitrary complexity count with positive canvas dimensions, actual path ink, decorative semantics and no embedded controls/answer text. The108-stage browser geometry matrix remains unchanged. Passing these tests is not a claim that the artwork has been visually or human-reviewed.
