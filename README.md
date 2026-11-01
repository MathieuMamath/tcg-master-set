# TCG Master Set

A cozy single-player 3D game about collecting. You live in a small modern town, earn coins through daily quests, buy booster packs at the shop, and fill your binders until every master set is complete. Duplicates sell back to the shop for more coins.

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
pnpm cards:import 30th me05 me04 me03 me02.5 me02 me01 sv10.5w sv10.5b sv10 sv09 swsh3
pnpm dev
```

## Legal notice

This is an unofficial, non-commercial fan project. It isn't produced, endorsed, supported by or affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company, who own their respective names and artwork.

This repository contains no card data or card images. The 3D models come from Kenney's [Mini Characters](https://kenney.nl/assets/mini-characters), [Furniture Kit](https://kenney.nl/assets/furniture-kit) and City Kits ([Suburban](https://kenney.nl/assets/city-kit-suburban), [Commercial](https://kenney.nl/assets/city-kit-commercial), [Roads](https://kenney.nl/assets/city-kit-roads)), under the CC0 license. The interface uses the [Fredoka](https://fonts.google.com/specimen/Fredoka) font, under the SIL Open Font License. To report a rights issue, please [open an issue](https://github.com/MathieuMamath/tcg-master-set/issues).
