# CLAUDE.md

[`README.md`](README.md) describes the project. This file holds what an agent needs on top of it.

## Language

- **Everything in the repository is in English**: code, identifiers, comments, file names, the database schema, commits, branches, PR titles and descriptions.
- Player-facing text exists in English and French, and only in translation files, never inline.
- Talk to the user in French.

## Rules that protect the project

- **Never commit card data or card images**, nor any other third-party asset whose license allows no redistribution. They are imported at runtime or deploy time from outside the repository. The repository runs on placeholder cards.
- **Keep the product name, domain, logos and repository metadata generic**, without third-party trademarks.
  - **Temporary exception, decided by the owner**: the card back in `components/game/card-back.tsx`, used when opening boosters and in Papy Caillou's memory game, imitates the real cards' back. The owner allows it for now, knowing the consequences, and it is to be replaced by a back of our own later. Don't add other third-party designs on the strength of it.
- **The server decides.** Booster draws, balances, duplicate coins and quest rewards are computed on the server, never trusted from the browser. The browser only displays the result. Coins, boosters and the collection live in the database and only change through `player/progress.ts`.
- **Statistics only in aggregate.** The game's statistics count and add up across players, and never show a player's name, email or anything that points to one player.
- **No real money**: no payments, donations or ads.
- **Single-player only.**

## Git workflow

Work reaches `main` through a squashed PR, never a direct push. Lefthook refuses a push from `main`, and GitHub refuses force-pushing or deleting it.

- **Branches**: `<type>/<topic>`, such as `feat/booster-opening`.
- **Commits and PR titles**: Conventional Commits, `type(scope): subject`.
- **Types**: `feat`, `fix`, `perf`, `docs`, `refactor`, `revert`, `chore`, `build`, `ci`, `style`, `test`, plus `balance` (numbers change, no new mechanic) and `content` (cards, sets, NPCs or text added, no new system).
- **Scopes** name systems, not files: `city`, `shop`, `boosters`, `binder`, `quests`, `npc`, `cards`, `accounts`, `db`, `i18n`, `deps`.
- **`/open-pr`** runs the gate, pushes, writes the description and turns on Auto-fix. **`/sync`** cleans up once the user says a PR is merged.
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
| `pnpm db:studio` | Browse the local database in Drizzle Studio |
| `pnpm db:logs` | Follow the local PostgreSQL's logs |
| `pnpm cards:import <set id>` | Copy a card set from TCGdex into the database |

## Data

The schema lives in `db/schema`, and every change goes through a migration in `db/migrations`. Call `getDb()` from `db/client.ts` on the server only. Add a table with the feature that needs it.

`game_events` is the game's event log, only ever added to. Every action that changes a player's coins, boosters, collection or quests records its event with `recordEvent` from `player/events.ts`, in the same transaction, so that an event exists exactly when its action does. Signing up and in are recorded too, from `auth/server.ts`, and so is each arrival in another place, through a door or by bus, when the spot saved changes place. The catalogue of types and their details is in `game/events.ts`. It is a contract with whatever reads the log, the game's statistics now and tools of their own later: a type's name and its details' fields never change once recorded, a new need gets a new field or a new type, and details hold no personal data. A new action gets its type in the catalogue, and a test fails for any type that nothing records.

`player_cards` deliberately has no foreign key to `cards`, because `pnpm cards:import` replaces a set's card rows.

`player_spots` keeps where the character stands, its place, how far along the floor and which way it faces, saved from the browser at each change of place and when the page is left, and checked by `parseSpot` in `game/spot.ts`. A spot gives no advantage, so it isn't checked for how the player got there. A spot that a change of the places has made invalid is ignored, and the player starts in the bedroom.

## Cards

The card catalogue comes from [TCGdex](https://tcgdex.dev/) and only lives in the database, never in the repository. Tests use placeholder data. `pnpm cards:import` copies a set in one transaction and can run again safely. Card images stay hosted by TCGdex.

The game plays with the sets in `game/card-sets.ts` that have been imported, and shopkeepers only sell those in `SOLD_SET_IDS`. A player can only buy a set's boosters after buying its binder from Mamie Noisette, the hedgehog who keeps the bookshop, and the binder list only shows the binders they bought. Talking to a seller offers to open her shop window, `components/game/shop-window.tsx`: every item in a grid, and the chosen one's details with the button to buy it. Boosters can be bought several at a time, up to `MAX_BOOSTER_QUANTITY` in `game/shop-dialogue.ts`, paid for and added in one transaction. A set without its own recipe in `game/booster.ts` gets one built from its rarities, and a set without its own pack theme in `components/game/pack-art.tsx` takes the colour of its logo from `game/set-colors.ts`.

Every booster holds ten cards, without energy or code bonus cards. A recipe adapts the slots to its set's rarities, and every version of every card must stay obtainable: `pnpm cards:import` warns about any that aren't. Cards are revealed from the most common to the best, following the recipe's `revealOrder`. As the game's own rule for every set, one booster in two thousand is instead a god pack of ten hits, which the opening only announces once the pack is cut.

The server only takes the booster and draws the cards when the pack is cut. Until then the player can back out at no cost, and backing out can't be used to draw again.

Opening a booster pays for its duplicates in the same transaction, from the values in `game/duplicate-coins.ts`. A duplicate is a version of a card the player already owns. The copy is kept, so that the binder still counts it.

Once cut, the pack climbs through light effects up to its best card, from a `PullTier` in `game/pull-tier.ts`. The server gives each card its tier from the rarity in English. A new rarity needs a tier there, or it gets the plain opening.

A card's `rarity` column is in English, because game rules compare it. Translated rarities are for display only.

## Quests

Six quests are daily. Each one's rules live in its own file under `game/`, and every reward is paid in `player/progress.ts`. A quest pays once a day, by UTC date, so that it can't be repeated for endless coins. Its row in `player_quests` keeps when an attempt started and the day it was last done.

Léa's quest is in `game/quests.ts`, with the timing rules the others share. Léa, the overworked rabbit next door, asks Pip to dust the walls of her flat: each patch of dust takes a few rubs with the interact key. The dusting happens in the browser, so the server records when an attempt starts and only pays if the time adds up. Her quest keeps the id and giver it had as the grandmother's (`grandma-cleaning`, `grandma`), because players' progress is stored under them. Until her walls are dusted for the day, Léa breathes fast and sweats.

Papy Caillou's memory game is in `game/memory-game.ts`. He is the old tortoise of the park, and his quest keeps the id it had as the grandfather's. Its board stays in `player_quests.memory_game`, and each flipped card is a request to the server, which alone counts the moves and pays. The game's pictures go to the browser at the start, without their positions.

Lucas's fishing quest is in `game/fishing.ts`, at the park's lake. Lucas is a little otter who keeps dropping his things in the water, and the player fishes them out. The server draws what comes up when it is reeled in, in the transaction that uses up the attempt, so backing out can't be used to draw again. His everyday things pay coins, and his treasure box, one time in five, pays a booster of the newest set on sale. The wait for a bite is only for show. The things are simple drawings of our own.

Gaspard's dalgona is in `game/dalgona.ts`. He is a slim, sly fox with a stand out in the street, between our house and the shop. The player carves a shape out of a caramel biscuit by holding a key or the button: the needle follows the outline while held, and the pressure builds, faster in the corners, until letting go eases it or the biscuit breaks. The server picks the shape from the moment the game starts, so that it needn't be stored, and pays by the shape. The browser only sends when each press started and ended, and the server replays them step by step with the same rules, after checking that the game took as long as its presses. A broken biscuit can be tried again, until one carved whole pays for the day.

Bérénice's raffle is in `game/raffle.ts`. She is a jolly goat with a stand out in the street, between the bookshop and the arcade, balloons tied to its posts. The player turns the drum's crank once a day for free: the server draws the ball and pays in the same transaction that uses up the day's turn, 3,000 coins for the golden ball three times in a hundred and 300 for a red one ten times in a hundred, and nothing otherwise. Nothing is drawn until the crank is turned.

The arcade's basketball machine is in `game/basketball.ts`. The browser only sends when each shot left, and the server replays them with the same rules to get the score, after checking that the game lasted its full time. It can always be played, and `player_high_scores` keeps the best score, but only one game a day pays: the first to earn a reward. A game that earns nothing leaves it to be won. The other machines are decoration.

The activity tracker, under the settings button, opens `components/game/activity-dialog.tsx`, whose first tab lists the day's quests from `game/activity.ts`. A quest counts as done once it is used up for the day, its `completed_on` set to today: paid for most, drawn for the raffle, won or not. Doing all six earns a daily bonus of 600 coins, which the player claims with a button, and which the server pays once a day under its own quest row, `daily-bonus`, after checking every quest. The game reads the day's activity again whenever a dialog closes.

## Accounts

Playing requires an account: pages and API routes check `getPlayer()` from `auth/session.ts` on the server. [Better Auth](https://www.better-auth.com/) handles sign-up, sign-in, sessions and password hashing through `auth/server.ts`. Only the email, username and hashed password are collected. Show players `auth/rules.ts` error keys, never the library's messages.

## Languages

Text lives in `messages/en.json` and `messages/fr.json`, which must define the same keys. A test enforces this. URLs carry the language, such as `/en` and `/fr`. Players change it in the settings menu, or with the switcher on the sign-up and sign-in pages.

## Game code

Game rules live in `game/` as plain tested functions, without React or Three.js. `components/game/` displays them, and the scene loads only in the browser.

The world is made of paper cut-outs, seen from the side like a diorama: characters only walk left and right. The drawings are made by code on canvases in `components/game/paper-art.ts`, so the repository holds no images. The player is Pip, a fox. `components/game/paper-scene.tsx` holds every place: the bedroom, the street with our house, the shop, the Card Den, run by raccoon triplets, the bookshop, the Page Nook, which sells nothing but binders, Léa's flat in the block at the far left, Gaspard's dalgona stand, Bérénice's raffle stand, the arcade, and the bus stop at the far right. The stop's sign opens the map of the stops the bus serves, from `game/bus.ts`, and the bus takes the player to the other stops: Linden Park, with Papy Caillou and Lucas, and the big city, whose modern towers rise out of sight and can be seen far behind the village from the street. Their places keep the ids `park` and `downtown`. A place's layout along its floor, the stretches where the player can do something, and its doors with where each one leads, live in `game/side-rooms.ts`. A door is used with the interact key, rather than by walking into it. Characters are never still: they breathe, and those whose eyes can be seen blink, drawn a second time with their eyes shut. Talking to a character is offered in a speech bubble just above its head, placed from the top of its drawing so that it fits any size. Everything else is offered at the bottom of the screen. The sky through windows comes from `game/sky.ts`, ready to follow the time of day and the weather.

Desktop comes first: comfort, polish and effects are designed for it. Phones must still work, with every screen usable and the game playable, but they don't need to match it, and a choice between the two goes to desktop.

The game must stay playable with the keyboard alone. Every screen puts the focus on something that can be pressed, and menus follow the movement keys through `components/game/menu-focus.ts`. Don't use `disabled` on a button that can have the focus, because the browser takes the focus away and no key reaches the dialog any more. Use `aria-disabled` instead.

The game was first a 3D town of Kenney models, rebuilt place by place in paper. Its code and models are gone: don't bring 3D models back without asking.

## Next.js

Read [`AGENTS.md`](AGENTS.md) before writing Next.js code. `next dev` maintains that file, so leave its block as it is.

Cache Components stays off until a feature needs it: player data must never be served from a cache.
