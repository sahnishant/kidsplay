# #112 semantic animation coverage delta

The repository coverage report is deterministic from `content/animations/**` and `content/scenes/**`.

## Before #112

- Authored semantic compositions: **8**
- Compositions referenced by child-facing scenes: **7**
- Composed child-facing scenes: **7**
- Semantic identities: **4** (`dog`, `whale`, `bird`, `cow`)
- Multi-state semantic identities: **1** (`dog`)
- Legacy science scenes migrated by this issue: **0/9**

## Expected after #112

- Authored semantic compositions: **18**
- Compositions referenced by child-facing scenes: **17**
- Composed child-facing scenes: **17**
- Semantic identities: **12**
- Multi-state semantic identities: **2** (`dog`, `wind`)
- Legacy science scenes migrated by this issue: **9/9**
- New reviewed process scene: **1** (`seed → sprout → young plant`)

The one intentionally authored-but-not-scene-integrated composition remains `animation.dog.curious-bone`; #112 does not change that prior state.

Final CI/report output should be treated as authoritative if it differs from these deterministic pre-check counts.
