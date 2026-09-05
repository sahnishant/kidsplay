# STUDIO-04 Y — visual and accessible submitted-work review

Follow-up to the A–X execution table in `reusable-learning-studios-execution.md`; total implementation/review work packages: **25**. GitHub #264 owns exact current-head results.

The passing `f1ad996` browser artifact exposed a usability defect: disabled BELL tiles had very low visual emphasis after submission. The child could no longer read their constructed word clearly. Passing interaction tests did not establish visual acceptance.

Pass Y preserves full opacity and the studio text colour on locked letter/part/category controls. The controls remain inert until Change my answer; this does not make a submitted answer editable or award another attempt.

An accessible group outside the inert renderer describes the child's actual submitted order or allocation. It does not project the correct answer: tests explicitly describe an incorrect 3/4 allocation and reversed B/A sequence as submitted. Malformed work receives no invented description.

The real Bicycle browser journey now checks opacity, text-colour parity and the accessible submitted-work group before capturing its screenshot. This is automated/render inspection, not real-child or screen-reader-user acceptance. The earlier low-contrast screenshot remains historical evidence, not the final appearance.
