# NAV100 agent runbook

Authority: master [#1](https://github.com/sahnishant/kidsplay/issues/1), scoped parent [#284](https://github.com/sahnishant/kidsplay/issues/284), and the explicitly assigned child issue. Read [ORCHESTRATION.md](ORCHESTRATION.md) and [ACCEPTANCE.md](ACCEPTANCE.md).

This workflow is designed for implementation agents operating with limited context. It makes decisions explicit and keeps work small. Model names do not grant permissions or prove capability. GitHub issues do not launch agents automatically. The coordinator/owner must initiate workers and advance gates; dependencies are not currently enforced by a GitHub bot.

## Roles

**Coordinator:** owns the queue, active claims, exact file ownership, scope amendments, dependency readiness and handoffs. Keeps #1 informed. Does not falsely report dispatched workers or results.

**Design owner/reviewer:** resolves ambiguous taxonomy and product behaviour at G1. Implementation workers do not invent these decisions.

**Worker:** executes ONE ready issue, on ONE branch, within its allowlist. Builds/tests the defined output and reports blockers. It does not self-approve its PR, product acceptance or production release.

**Independent reviewer:** reads the actual diff and relevant source, reproduces behaviour/tests, identifies findings, verifies fixes and records the exact reviewed head. A second paragraph by the same worker is not independent review.

**Product owner:** records G3 usability acceptance and separate G4 production authorisation. An agent cannot impersonate this approval or fabricate child observations.

## Read before each task

1. Repository agent instructions and latest #1 body AND recent comments.
2. `docs/WORK_TARGETS.md`, current open PRs and any active claim touching your proposed files.
3. #284, the child issue, predecessor handoffs and approval comments.
4. This runbook, source notes, acceptance spec and any accepted audit/design/launch contracts.
5. Actual source and tests of the existing owners you will extend.

Until the planning docs PR merges, read the files from `orchestration/nav100-agent-workstream`. Later task documents do not exist yet: do not pretend to have read `EVIDENCE_AUDIT.md`, `DESIGN_DECISION.md`, `LAUNCH_CONTRACT.md` or proof reports before their producing task is accepted.

## Dependency and claim protocol

READY means eligible for assignment, not an agent currently running. BLOCKED means no speculative implementation. An open PR for a dependency is not sufficient unless the coordinator explicitly authorised a stacked branch with a pinned base; default policy is merge accepted predecessor first, then branch from current main.

Post this on your child issue:

```text
CLAIM REQUEST
Task: #...
Agent/session identifier: ...
Current main/base SHA: ...
Branch: ...
Approved dependency/gate links: ...
Exact owned paths: ...
Potential collisions: none verified / list
First bounded deliverable: ...
```

Wait for coordinator confirmation if not already explicitly assigned/confirmed for that exact scope. A claim comment is not an atomic lock. Recheck before writing. Never overwrite another worker's files or move an existing branch ref to claim it.

Create your task branch only when ready. No pre-created speculative implementation branches. Suggested branch names are in each issue. If one exists, inspect its ownership and work; do not reset/force-push it. Keep unrelated local changes/worktrees intact.

State sequence: `BLOCKED -> READY -> CLAIMED -> IN_PROGRESS -> REVIEW -> ACCEPTED/MERGED -> DONE`. Coordinator updates the issue title/status comment and parent queue. A worker waiting for missing inputs uses BLOCKED with evidence. An issue can be DONE only when its required artifact and gate conditions are met, not because a PR exists.

## Execute a bounded pass

1. Restate the assigned objective, approved file allowlist and non-goals in the PR; do not rewrite the architecture.
2. Inspect the existing implementation and test ownership. Confirm imports/IDs/versions; never rely on a guessed path or an old snippet.
3. Write or update the focused regression for the assigned behaviour, then the smallest implementation change. Documentation-only tasks must not edit runtime simply to investigate it.
4. Run focused tests. Review the complete diff for generated files, lockfiles, global styles, accidental content copies and authority changes.
5. Run the task's required integration checks at the actual head. Record failures rather than weakening tests, increasing budget limits, suppressing assertions or changing expected mastery to match a bug.
6. Open/update one bounded PR. Larger pilot tasks explicitly require one pilot wiring commit and test before the next. If work cannot stay reviewable, ask the coordinator to split remaining scope; do not silently add a new platform/framework.
7. Supply a handoff another fresh agent can execute from GitHub alone.

## Stop and ask the coordinator

- Missing G0/G1/G2/G3/G4 approval required by the issue.
- Conflicting current #1/work-target instructions or active shared-file ownership.
- Need to change source/knowledge/lexicon/profile/answer/evidence/session authority outside the approved seam.
- Missing canonical activity ID, source page, translation, model capability or checkpoint support.
- Need to invent a taxonomy label, age ladder, paywall, new daily recommender or universal progress score.
- Failing required baseline/integration test, unsupported platform, unavailable source/runner or unverified native behaviour.
- Expected fixture mistaken for real curriculum; an unsupported activity replaced with a quiz just to make the checklist green.
- Work requires destructive resets, force push, progress migration/deletion or an unrelated branch merge.

Use:

```text
BLOCKED
Task / base / head: ...
Observed fact and reproduction: ...
Exact missing authority, input or capability: ...
Smallest decision or follow-up required: ...
Files already changed: ...
Tests run / not run: ...
No production change made: true/false, explain
```

A blocker report is a correct task outcome. Do not guess to look productive.

## Reference and evidence invariants

- Discovery metadata points to existing registries. It never owns answers, science truths, lexical meanings or a copied curriculum.
- A shared studio launched from Lab and from a workshop remains one registered activity. Store entry context only where the approved navigation contract allows it.
- New navigation-only bookmarks/recent references are not a progress database. Reuse existing ownership; new persistence requires G1's explicit contract and scope.
- Do not emit attempts/mastery on viewing cards, moving between menus, watching a demonstration, restoring a checkpoint or re-entering the same activity.
- Keep existing exploration, guided practice and evaluative policies. Never map a vocabulary hit to unrelated science understanding.
- Do not claim exact resume for an experience that only supports reopening. Labels and test assertions must match real support.
- Capability/readability/motor support and curriculum placement are different. A grade filter is not an assessment result.
- Source PDFs may exist only in the user's ChatGPT session. SOURCE_MATRIX records inspection notes and limitations. Actual curriculum authoring requires the repository source workflow and accessible evidence; no guessed online replacement or whole-book upload.

## Commands and proof discipline

The inspected baseline `package.json` defines:

```text
npm ci
npm run compile:content
npm run typecheck
npm run test:run -- <actual focused test paths>
npm run check
npm run test:e2e
git diff --check
```

`check` already invokes the build/content/type/bundle validations followed by unit tests. `test:e2e` builds before Playwright. Recheck scripts and toolchain at the current base. Do not run literal placeholder paths, introduce a package upgrade to use these instructions or call a nonexistent script. Follow the repository's actual platform workflow for Android.

Compilation can generate changes. Inspect `git status`/diff; do not commit unrelated outputs or discard someone else's work. Documentation-only tasks require whitespace/link/path checks; runtime CI status is pending/not run until actually observed. No claim that this planning pack itself has passed runtime tests.

For each run record command, exact head SHA, OS/toolchain, outcome, meaningful output and artifact location. Distinguish `PASS`, `FAIL`, `NOT RUN`, `BLOCKED`. A CI pass at an older head does not certify new commits. Browser offline simulation does not prove a packaged Android installation works offline.

## PR and handoff template

```text
Task and parent: #... / #284
Dependency/G1 decision links: ...
Base SHA / head SHA: ...
Changed paths and purpose: ...
Implemented behaviour: ...
Preserved authority/runtime boundaries: ...
Test table: command | environment | SHA | result | artifact
Screenshots/interaction traces, with viewport and SHA: ...
Source access / untested platforms / unsupported resume: ...
Known gaps and linked follow-ups: ...
Default-off / rollback status: ...
Next eligible task (not self-authorised): ...
```

Reference issues while under review. Do not close #284 via an automatic closing keyword. Close individual tasks only when their acceptance/merge/gate conditions are met. Leave unrelated capability/content gaps open.

## Independent review protocol

The reviewer re-reads the task, G1 contract and actual diff, then follows at least the key real launch/return paths. Review canonical identity, entry context, evidence ownership, fixture isolation, default-off behaviour and regressions, not just visual snapshots.

Record findings as `severity | file:line | reproduction | expected | actual | correction/test needed`. Worker fixes findings in scope and re-runs affected checks. Reviewer verifies the new exact head. Unavailable reproduction remains NOT RUN, not approved by assumption. Self-review is useful but cannot substitute for required independent/product approval.

## Coordinator gate comment template

```text
NAV100 GATE: G0/G1/G2/G3/G4
Decision: APPROVED / ACCEPTED / REJECTED / PENDING
Reviewer/owner and delegated authority: ...
Artifact/PR/head SHA: ...
Scope, exact labels/contracts/paths or platforms authorised: ...
Required evidence checked: ...
Remaining limitations/blockers: ...
Tasks now READY: ...
```

Only the owner can explicitly authorise G4. The coordinator must not infer it from praise, green tests, task creation or a previous request to explore ideas.

## Copyable initial worker assignment

```text
Repository: sahnishant/kidsplay.
Execute only NAV100-01, issue #285, under #284 and master #1.
Read the latest issue bodies/comments, repository agent instructions,
WORK_TARGETS and docs/nav100/AGENT_RUNBOOK.md. Read the planning docs
from orchestration/nav100-agent-workstream until merged.
Confirm dependencies and exact allowed paths, post/confirm your claim,
and produce the two evidence-audit documents specified in #285.
Inspect actual current registries/IDs/tests. Do not implement the home,
change content/evidence/runtime or invent inaccessible PDF facts.
Open a bounded docs PR with exact-head evidence and a fresh-agent handoff.
Stop on missing authority or a file-ownership collision.
```

Use the same envelope for later workers with an explicitly READY issue. Do not assign one agent all ten tasks or ask it to bypass design/product gates.
