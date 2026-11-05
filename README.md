# TCG Master Set

A cozy single-player game about collecting, in a world of paper cut-outs. You play Pip, a little fox in a small town, earn coins through daily quests, buy binders at the bookshop and booster packs at the shop, and fill your binders until every master set is complete. Duplicates turn into more coins, depending on their rarity.

There are no duels and no real money.

> **Status:** playable. The town, its shops, six daily quests and the binders are in. More places, quests and polish will follow.

## The game

The world is a paper diorama seen from the side: Pip walks left and right, and goes through doors with the interact key.

- **The street**, with Pip's house, Léa's block of flats, a dalgona stand, a raffle stand, an arcade and a bus stop. The bus goes to **Linden Park** and to **the big city**, whose towers can be seen far behind the village.
- **The Card Den**, where the raccoon triplets sell booster packs, and **the Page Nook**, where Mamie Noisette the hedgehog sells binders. A set's boosters are sold once its binder is bought.
- **Booster openings**: ten cards a pack, revealed from the most common to the best, with light effects that climb up to the best card.
- **The binder**: a book of pages for each set, which turn like a real binder's, with every version of every card to collect.
- **Six daily quests**, each paid once a day:
  - dusting Léa's flat;
  - Papy Caillou's memory game at the park;
  - fishing out Lucas's things from the lake;
  - the arcade's basketball machine;
  - carving Gaspard's dalgona biscuit;
  - a free turn of Bérénice's raffle drum.
- **The activity tracker** counts the day's quests, and doing all six earns a daily bonus.
- **Day, night and weather**: the game's own clock runs a day in 24 minutes, with rain, storms and winter snow. Street lamps light up at night, and Pip can sleep in his bed until the morning.
- **The statistics bureau**, in the big city, where only admins get past the guard at the door.

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

## Contributing

Work reaches `main` through squashed pull requests with [Conventional Commit](https://www.conventionalcommits.org/) titles. Each merge automatically produces a version tag, a changelog entry and a GitHub Release. The commands, the rules and how the code is laid out are in [`CLAUDE.md`](CLAUDE.md).

## Legal notice

This is an unofficial, non-commercial fan project. It isn't produced, endorsed, supported by or affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company, who own their respective names and artwork.

This repository contains no card data or card images: they come from [TCGdex](https://tcgdex.dev/) when the game is set up, and the card images stay hosted by TCGdex. Every drawing in the game is made by code, so the repository holds no images either. The interface uses the [Bagel Fat One](https://fonts.google.com/specimen/Bagel+Fat+One), [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand) and [Courier Prime](https://fonts.google.com/specimen/Courier+Prime) fonts, under the SIL Open Font License. To report a rights issue, please [open an issue](https://github.com/MathieuMamath/tcg-master-set/issues).
