# TCG Master Set

A cozy single-player game about collecting, in a world of paper cut-outs. You play Pip, a little fox in a small town, earn coins through daily quests, buy binders at the bookshop and booster packs at the shop, and fill your binders until every master set is complete. Duplicates turn into more coins, depending on their rarity.

There are no duels and no real money.

> **Status:** early setup. The game isn't playable yet.

## Stack

Next.js, Three.js and PostgreSQL, self-hosted. The game is available in English and French.

## Contributing

Work reaches `main` through squashed pull requests with [Conventional Commit](https://www.conventionalcommits.org/) titles. Each merge automatically produces a version tag, a changelog entry and a GitHub Release. The details are in [`CLAUDE.md`](CLAUDE.md).

You need Node.js 26, pnpm 10 or later, and Docker.

```bash
pnpm install
cp .env.example .env.local # then set AUTH_SECRET
pnpm db:up
pnpm db:migrate
pnpm cards:import all
pnpm dev
```

## Legal notice

This is an unofficial, non-commercial fan project. It isn't produced, endorsed, supported by or affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company, who own their respective names and artwork.

This repository contains no card data or card images. Every drawing in the game is made by code, so the repository holds no images either. The interface uses the [Bagel Fat One](https://fonts.google.com/specimen/Bagel+Fat+One), [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand) and [Courier Prime](https://fonts.google.com/specimen/Courier+Prime) fonts, under the SIL Open Font License. To report a rights issue, please [open an issue](https://github.com/MathieuMamath/tcg-master-set/issues).
