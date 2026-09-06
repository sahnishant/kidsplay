# Studio Android startup integration review

Scope: owner-requested merge of #263 and #266. Keep #264/#265 acceptance and remaining architecture work open.

Android offline run 34016561987 attempt 1 at graph head `2a0a9d412a5f3f324aee8d8b4d95d661f73f39c1` built the APK and passed the complete Stories airplane-mode recovery flow. The next cold launch, before any studio activity, exposed the Android system's "Kidsplay isn't responding" dialog instead of Home. The job correctly failed. Failed evidence remains artifact 9984159236, digest `sha256:633ef14bcb37bed12279782168ac8e17d0d2ac1782b658562763925040083fa8`.

The browser-only repair changed no native or application runtime code compared with the preceding successful native run 34013131526. One same-head native rerun was requested to investigate reproducibility, not to establish a root cause. Results belong in the exact-run merge checkpoint; the ANR is not retroactively called an infrastructure failure.

Inspection found a harness precondition gap: Stories first waits for Home accessibility; studios immediately starts a scrolling tap search after observing a PID. Align the studio cold-start and process-relaunch paths with the existing bounded `assert_label` Home readiness check. Only then may navigation input begin. A failed readiness check remains fatal and now retains bounded logcat, last-ANR and input-state diagnostics. It never taps Wait/Close app, relaunches automatically, extends the existing readiness polling limit or converts an app failure to a pass.

The additional unit test guards this harness ordering and failure contract; it is not Android execution or proof of the ANR's root cause. Existing on-device interaction, changed-PID, exact restored design/mode, native Back, rotation and airplane-mode assertions are unchanged. Final integration must pass the complete packaged native journey. No application runtime behavior or approval state is changed by this harness repair.
