# TOPIC-23 — submitted sequence work must remain readable

The exact-head browser run33991596949 at `d5ef100` passed all new journeys and published artifact9976835801. Inspection confirmed the fixed plant frame and visible feedback, but showed another mismatch: freshly checked story cards were faded while restored cards remained dark. The renderer's disabled state differed on first submission versus remount, even though the shared parent was inert in both.

Extend the existing studio-only full-opacity text treatment from letter/fraction controls to sequence-order items. Keep controls inert and preserve the child's actual order; do not replace it with the expected answer. The existing story feedback browser case now checks every submitted card's opacity and foreground colour plus unchanged text/order before capturing proof.

No evaluator, source data, saved-work or threshold changes. This is the23rd cross-topic work package in13 commits, not an extra game. Six new child-facing consumers remain, twenty total. Final observed CI and screenshot evidence belong in #264; human and physical-device acceptance remain open.
