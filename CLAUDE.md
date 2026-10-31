# CLAUDE.md

[`README.md`](README.md) describes the project. This file holds what an agent needs on top of it.

## Language

- **Everything in the repository is in English**: code, identifiers, comments, file names, the database schema, commits, branches, PR titles and descriptions.
- Player-facing text exists in English and French, and only in translation files, never inline.
- Talk to the user in French.

## Rules that protect the project

- **Never commit card data or card images**, nor any other third-party asset whose license allows no redistribution. They are imported at runtime or deploy time from outside the repository. The repository runs on placeholder cards.
- **Keep the product name, domain, logos and repository metadata generic**, without third-party trademarks.
- **The server decides.** Booster draws, balances, resale and quest rewards are computed on the server, never trusted from the browser. The browser only displays the result.
- **No real money**: no payments, donations or ads.
- **Single-player only.**

## Git workflow

Work reaches `main` through a squashed PR, never a direct push. Lefthook refuses a push from `main`, and GitHub refuses force-pushing or deleting it.

- **Branches**: `<type>/<topic>`, such as `feat/booster-opening`.
- **Commits and PR titles**: Conventional Commits, `type(scope): subject`.
- **Types**: `feat`, `fix`, `perf`, `docs`, `refactor`, `revert`, `chore`, `build`, `ci`, `style`, `test`, plus `balance` (numbers change, no new mechanic) and `content` (cards, sets, NPCs or text added, no new system).
- **Scopes** name systems, not files: `city`, `shop`, `boosters`, `binder`, `quests`, `npc`, `cards`, `accounts`, `db`, `i18n`, `deps`.
- **`/open-pr`** runs the gate, pushes and writes the description. **`/sync`** cleans up once the user says a PR is merged.
- **Commit or push only when asked.** Merging is always the user's call.
- **Never write a CI-exclusion marker** in a commit message or PR text. GitHub Actions obeys it anywhere in the message, which skips the release.
- **Do not edit `CHANGELOG.md` or the version by hand.** Every merge to `main` makes the `release` job in `.github/workflows/ci.yml` bump the version, regenerate the changelog, tag `vX.Y.Z` and publish a GitHub Release.

## Commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies and the Git hooks |
| `pnpm lint` | Check lint and formatting, the quality gate today |
| `pnpm format` | Apply lint and formatting fixes |
