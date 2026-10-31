---
description: Sync main with the remote and delete the local branches whose pull request has been merged.
---

# Sync main and clean up merged branches

Run after a pull request is merged on GitHub. The remote branch is deleted automatically
(`delete-branch-on-merge` is on for this repo), but the local branch and its stale
remote-tracking ref both survive, so they pile up.

## 1. Sync

```bash
git switch main && git pull --ff-only && git fetch --prune origin
```

`--prune` is what drops the `origin/<branch>` refs pointing at branches GitHub already
deleted. `--ff-only` refuses to create a merge commit if `main` has diverged — if it
fails, stop and report it rather than forcing anything.

## 2. Decide what is safe to delete

For each local branch other than `main`, ask GitHub whether its PR was merged:

```bash
gh pr list --head "<branch>" --state all --json number,state,mergedAt
```

**This is the only reliable test, and the two obvious alternatives both lie:**

- `git branch -d` refuses every squash-merged branch, because no merge commit ever
  pointed at it. Its refusal does not mean there is unmerged work.
- Comparing trees (`git diff main <branch>`) reports a difference as soon as `main`
  moves ahead, which it always has by the time you run this. A difference does not mean
  the branch holds anything of its own.

A branch is safe to delete when its PR is `MERGED`. Anything else — `OPEN`, `CLOSED`
without merging, or no PR at all — stays, and gets reported to the user instead.

## 3. Delete

Squash merges force `-D`, so `-d`'s safety net is not available and step 2 *is* the
safety net. Never widen this to "delete every branch that is not main".

```bash
git branch -D <merged-branch> [<merged-branch>...]
```

## 4. Report

List what was deleted, and name anything deliberately kept along with why (open PR, no
PR, closed unmerged). If a branch has no PR it may be unpushed local work — say so
clearly rather than dropping it.

Deleting a branch does not destroy its commits immediately: `git reflog` still has them,
and the command prints the SHA it deleted. Include those SHAs in the report so a mistake
stays recoverable.
