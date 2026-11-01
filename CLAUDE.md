# CLAUDE.md

[`README.md`](README.md) describes the project. This file holds what an agent needs on top of it.

## Language

- **Everything in the repository is in English**: code, identifiers, comments, file names, the database schema, commits, branches, PR titles and descriptions.
- Player-facing text exists in English and French, and only in translation files, never inline.
- Talk to the user in French.

## Rules that protect the project

- **Never commit card data or card images**, nor any other third-party asset whose license allows no redistribution. They are imported at runtime or deploy time from outside the repository. The repository runs on placeholder cards.
- **Keep the product name, domain, logos and repository metadata generic**, without third-party trademarks.
- **The server decides.** Booster draws, balances, resale and quest rewards are computed on the server, never trusted from the browser. The browser only displays the result. The one temporary exception is the wallet in `game/shop-dialogue.ts`, which lives in the browser for one visit until it moves to the database. Boosters are drawn on the server for any signed-in player, because it doesn't store who owns one yet. The collection is also provisional: `components/game/collection-storage.ts` keeps it in `localStorage`, per player and per browser, so a player could edit it.
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
| `pnpm dev` | Start the development server |
| `pnpm lint` | Check lint and formatting |
| `pnpm format` | Apply lint and formatting fixes |
| `pnpm typecheck` | Check types |
| `pnpm test` | Run the unit tests |
| `pnpm build` | Build for production |
| `pnpm db:up` / `pnpm db:down` | Start or stop the local PostgreSQL on port 5433 |
| `pnpm db:generate` | Create a migration from `db/schema` |
| `pnpm db:migrate` | Apply the migrations |
| `pnpm db:reset` | **Delete the local data**, then recreate the database |
| `pnpm cards:import <set id>` | Copy a card set from TCGdex into the database |

## Data

The schema lives in `db/schema`, and every change goes through a migration in `db/migrations`. Call `getDb()` from `db/client.ts` on the server only. Add a table with the feature that needs it.

## Cards

The card catalogue comes from [TCGdex](https://tcgdex.dev/) and only lives in the database, never in the repository. Tests use placeholder data. `pnpm cards:import` copies a set in one transaction and can run again safely. Card images stay hosted by TCGdex.

The game plays with the sets in `game/card-sets.ts` that have been imported. A new set also needs a recipe in `game/booster.ts` and a pack theme in `components/game/booster-opening.tsx`.

A card's `rarity` column is in English, because game rules compare it. Translated rarities are for display only.

## Accounts

Playing requires an account: pages and API routes check `getPlayer()` from `auth/session.ts` on the server. [Better Auth](https://www.better-auth.com/) handles sign-up, sign-in, sessions and password hashing through `auth/server.ts`. Only the email, username and hashed password are collected. Show players `auth/rules.ts` error keys, never the library's messages.

## Languages

Text lives in `messages/en.json` and `messages/fr.json`, which must define the same keys. A test enforces this. URLs carry the language, such as `/en` and `/fr`.

## Game code

Game rules live in `game/` as plain tested functions, without React or Three.js. `components/game/` displays them, and the 3D scene loads only in the browser.

3D models live in `public/models/`, with their license next to them. Only commit the files the game uses.

## Next.js

Read [`AGENTS.md`](AGENTS.md) before writing Next.js code. `next dev` maintains that file, so leave its block as it is.

Cache Components stays off until a feature needs it: player data must never be served from a cache.
