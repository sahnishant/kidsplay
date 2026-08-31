# Local sync recovery

If a local checkout behaves differently from the current GitHub `main`, first prove branch and worktree state before treating the failure as a repository regression.

```powershell
git status --short --branch
git fetch origin --prune
git switch main
git pull --ff-only origin main
git status --short --branch
```

For a deliberately disposable local `main` with no local work to preserve, an exact reset can be used instead:

```powershell
git fetch origin --prune
git switch main
git reset --hard origin/main
git clean -fd
```

`git clean -fd` deletes untracked files/directories. Do not use the destructive reset/clean sequence when local work must be preserved.

A plain `git branch -r` can show stale remote-tracking refs until `git fetch --prune` has run. GitHub's current branch list is authoritative for whether a remote branch still exists.
