---
description: Verify the quality gate, push the current branch, and open a labelled GitHub PR against main (assigned to you) with a review-ready description.
argument-hint: "[optional: title hint or extra context to emphasise]"
---

# Open a pull request for the current branch

Take the **current branch**, prove it's sound, push it, and open a well-documented PR against `main`.

The user invoking this command **is** the explicit authorization to push.

If the user passed arguments, treat them as a hint for the PR title or what to emphasise: `$ARGUMENTS`

Work through the steps in order. If a step fails, **stop, report it plainly, and don't push or open the PR** until it's resolved.

## 1. Preflight

- **Branch check.** `git branch --show-current`. If it's `main`, stop and offer to move the work onto a branch (`git switch -c <type>/<topic>`).
- **Clean tree.** `git status --short`. If there are uncommitted changes, stop and ask the user whether to commit them, following the conventions in `CLAUDE.md`.
- **Understand the change.** The description depends on this:
  - `git log main..HEAD --oneline`
  - `git diff main...HEAD --stat`
  - Read the diff for anything non-obvious, so the "how / why" is accurate rather than generic.

## 2. Quality gate

```bash
pnpm lint
```

**This is the only place the gate is defined.** `.github/workflows/ci.yml` and `lefthook.yml` mirror it: a check added here must be added there too.

If the change touches the UI or the 3D scene, the gate proves none of what matters. Also check it in the browser: no console errors, and the changed behaviour observed rather than assumed. Check the phone layout when the change is visible on mobile.

## 3. Documentation

Every PR carries its own documentation. Ask what this change makes untrue in `README.md`, `CLAUDE.md` and this file, and fix it in the same PR. Prefer deleting a claim to updating it. If a decision is reversed, keep the reasoning and mark it superseded.

## 4. Push

```bash
git push -u origin <current-branch>
```

## 5. Open the PR

**Write the title and body in English**, whatever language the conversation is in.

**Title**: a valid Conventional Commit, `type(scope): subject`. It becomes the squash commit on `main` and drives the changelog and the version bump, and CI rejects anything else.

**Body**: follow `.github/pull_request_template.md`, ending with the attribution line the session specifies. The body becomes the squash commit's message, so:

- Write it as a commit message, for someone with no PR page in front of them.
- Leave out anything about the act of reviewing. The test plan goes in the comment in step 6.
- Never write a CI-exclusion marker in it, or in the title. GitHub Actions obeys one anywhere in a commit message, which would skip the release. Name it in prose if a PR has to discuss it.

**Labels**: one type label and every area label that applies.

| Type | Label |
|---|---|
| `feat` | `enhancement` |
| `fix` | `bug` |
| `docs` | `documentation` |
| `balance` | `balance` |
| `content` | `content` |
| `perf` | `performance` |
| `refactor` | `refactor` |
| `chore`, `build`, `ci`, `style`, `test`, `revert` | `maintenance` |

Area labels are `area: city`, `area: shop`, `area: boosters`, `area: binder`, `area: quests`, `area: cards`, `area: accounts`, `area: i18n` and `area: infra`.

```bash
gh pr create --base main --assignee @me --label "<type label>" --label "<area label>" --title "<conventional-commit title>" --body "$(cat <<'EOF'
<the body>
EOF
)"
```

Link related PRs and issues. If a PR already exists for this branch, don't create a second one: report its URL and offer to update its body.

## 6. Post the test plan as a comment

```bash
gh pr comment <number-or-url> --body "$(cat <<'EOF'
## Test plan

What you actually ran and observed, concretely enough to reproduce the confidence later.

## Manual checks for the reviewer

- [ ] `<step to perform>` → `<expected result>`
EOF
)"
```

A test plan that only says "ran the gate" verified nothing a reviewer could not have assumed.

## 7. Report

Give the PR URL as a markdown link, a one-line recap, and anything a reviewer should look at first. The merge itself is the user's. Once they say it's merged, `/sync` closes the loop.
