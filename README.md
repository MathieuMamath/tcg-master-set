# TCG Master Set

A cozy single-player game about collecting, in a world of paper cut-outs. You play Pip, a little fox in a small town, earn coins through daily quests, buy binders at the bookshop and booster packs at the shop, and fill your binders until every master set is complete. Duplicates turn into more coins, depending on their rarity.

There are no duels and no real money.

> **Status:** playable. The town, its shops, twenty daily quests and the binders are in. More places, quests and polish will follow.

## The game

The world is a paper diorama seen from the side: Pip walks left and right, and goes through doors with the interact key.

- **The street**, with Pip's house, Léa's block of flats, a dalgona stand, a raffle stand, an arcade and a bus stop. The bus goes to **Linden Park** and to **the big city**, whose towers can be seen far behind the village.
- **The Card Den**, where the raccoon triplets sell booster packs, and **the Page Nook**, where Mamie Noisette the hedgehog sells binders. A set's boosters are sold once its binder is bought.
- **Booster openings**: ten cards a pack, revealed from the most common to the best, with light effects that climb up to the best card.
- **The binder**: a book of pages for each set, which turn like a real binder's, with every version of every card to collect.
- **Twenty daily quests**, reset each day; the big city's and the park's games can be replayed, each new star paying more:
  - dusting Léa's flat;
  - Papy Caillou's memory game at the park;
  - fishing out Lucas's things from the lake;
  - the arcade's basketball machine;
  - carving Gaspard's dalgona biscuit;
  - a free turn of Bérénice's raffle drum;
  - three jobs for Yuzu at Ramen Yuzu, in the big city: washing up, helping in the kitchen and waiting tables;
  - two lessons from Maître Kaito at the dojo, next door: slicing vegetables and archery;
  - two chores for Pépin, the park's gardener: cleaning up the path, and a gentle watering of his flowers, once a day;
  - skipping stones on the park's lake with Papy Caillou;
  - Mamie Noisette's daily quiz about the village, Bérénice's Pop'Balloons, and sorting the mail for Gustave at the village post;
  - Pinceau's sliding puzzle by the park's lake, finding Mme Ronron's hidden kitten, and photographing the big city's sky for Flash.
- **The activity tracker** counts the day's quests, and doing any six of them earns a daily bonus.
- **Day, night and weather**: the game's own clock runs a day in 24 minutes, with rain, storms and winter snow. Street lamps light up at night, and Pip can sleep in his bed until the morning.
- **The administrative office**, in the big city, where only admins get past the guard at the door: the game's statistics, and upstairs, the coupons that players then use in the settings for coins or boosters.

It plays with a keyboard, a mouse or a touch screen, on a desktop first and on a phone too, in English and French.

## Stack

- [Next.js](https://nextjs.org/) and React, with the scene drawn by [Three.js](https://threejs.org/) through React Three Fiber. Every drawing is made by code on canvases.
- PostgreSQL with [Drizzle](https://orm.drizzle.team/), and [Better Auth](https://www.better-auth.com/) for accounts.
- [next-intl](https://next-intl.dev/) for the two languages.
- Biome, Vitest and TypeScript.

The server decides everything that matters: booster draws, coins and quest rewards are computed on it, never trusted from the browser. It is self-hosted.

## Getting started

You need Node.js 26, pnpm 10 or later, and Docker.

```bash
pnpm install
cp .env.example .env.local # then set AUTH_SECRET
pnpm db:up
pnpm db:migrate
pnpm cards:import all
pnpm dev
```

`pnpm cards:import` copies the card sets from [TCGdex](https://tcgdex.dev/) into the database, so it needs a network connection. The game then runs at <http://localhost:3000>, where you create an account to play.

## Deploying

The `Dockerfile` builds the standalone Next.js server, run by a user without privileges, and needs neither a database nor a secret to build. The container listens on port 3000 and checks itself on `/api/health`, which answers 503 when the database can't be reached. It needs a PostgreSQL database and three variables, listed in [`.env.example`](.env.example): `DATABASE_URL`, `AUTH_SECRET`, and `APP_URL`, the public address, which sign-in, the link previews and the emails' links depend on. Three more, `SCALEWAY_SECRET_KEY`, `SCALEWAY_PROJECT_ID` and `EMAIL_FROM`, send emails through [Scaleway Transactional Email](https://www.scaleway.com/en/transactional-email-tem/), from a domain verified there. Until they are set, the game hides password reset.

Deploying the image changes nothing in the database. The migrations, the runtime role and the cards are applied by hand, with the database owner's address, before the code that needs them goes live:

```bash
DATABASE_URL='<owner url>' pnpm db:migrate
psql '<owner url>' -v app_password='<password>' -f db/prod-runtime-role.sql
DATABASE_URL='<owner url>' pnpm cards:import all
```

The game connects as `tcg_app`, the role [`db/prod-runtime-role.sql`](db/prod-runtime-role.sql) creates: it reads and writes rows but can't change the schema. Tables made by later migrations get its rights on their own, as long as the owner that ran the script runs them. An admin is then made by hand, as [`CLAUDE.md`](CLAUDE.md) shows.

## Contributing

Work reaches `main` through squashed pull requests with [Conventional Commit](https://www.conventionalcommits.org/) titles. Each merge automatically produces a version tag, a changelog entry and a GitHub Release. The commands and the rules are in [`CLAUDE.md`](CLAUDE.md), and how the code is laid out, folder by folder, in [`docs/architecture.md`](docs/architecture.md).

## Legal notice

This is an unofficial, non-commercial fan project. It isn't produced, endorsed, supported by or affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company, who own their respective names and artwork.

This repository contains no card data or card images: they come from [TCGdex](https://tcgdex.dev/) when the game is set up, and the card images stay hosted by TCGdex. Every drawing in the game is made by code, so the repository holds no images either. The interface uses the [Bagel Fat One](https://fonts.google.com/specimen/Bagel+Fat+One), [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand) and [Courier Prime](https://fonts.google.com/specimen/Courier+Prime) fonts, under the SIL Open Font License. To report a rights issue, please [open an issue](https://github.com/MathieuMamath/tcg-master-set/issues).
