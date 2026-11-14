# Architecture

How the code is laid out, what each folder is for, and where a new piece goes. [`CLAUDE.md`](../CLAUDE.md) holds the rules that protect the project and describes each system in detail; this page is the map.

## Three layers

Everything the game does goes through three layers, and each folder belongs to one of them.

| Layer | Folders | What it holds | Runs in |
|---|---|---|---|
| **Rules** | `game/` | Plain functions: no React, no database, no network. Given data, they compute a result. | The browser **and** the server |
| **Display** | `components/`, `app/[locale]/` | React and Three.js: what the player sees and presses. | The browser |
| **Server** | `player/`, `stats/`, `cards/`, `coupons/`, `auth/`, `email/`, `db/`, `app/api/` | Reads and writes the database, checks who is asking, pays and charges. | The server only |

The rules run on both sides so that the server never trusts the browser and still plays by the same rules. A shift, for instance, is simulated in the browser from its seed and presses to draw it, then replayed on the server by the same function to count it.

### Who may import whom

```
components ──▶ game ◀── player, stats, cards, coupons
     │                        │
     └── types only ─────────▶│
                              ▼
                             db
```

- `game/` imports only `game/`. A rule that needs the database or React doesn't belong there.
- `components/` imports `game/` freely, but takes only **types** from the server folders, with `import type`. The exceptions are made for the browser: `auth/client.ts`, `auth/rules.ts` and `logoFiles` in `cards/tcgdex.ts`.
- `player/` and the other server folders import `game/` for the rules and `db/` for the tables.
- `app/api/` routes check the player with `auth/`, then call `player/` or another server module.

## A request, end to end

Taking Gaspard's dalgona as an example:

1. **The player talks to Gaspard.** `components/game/game.tsx` opens his conversation, `components/game/quests/quest-dialog.tsx`.
2. **They accept.** The browser calls `POST /api/quests/dalgona/start`, in `app/api/quests/dalgona/start/route.ts`, which checks the player and calls `startDalgona` in `player/quests/dalgona.ts`. That records the attempt in the database and draws the shape with the rules in `game/quests/dalgona.ts`.
3. **They carve.** `components/game/quests/dalgona-dialog.tsx` plays the game in the browser with the same rules, and keeps every press.
4. **They finish.** The browser sends the presses to `/api/quests/dalgona/finish`. `finishDalgona` replays them with `game/quests/dalgona.ts`, pays in the same transaction, reads the coins back with `coinsNow` from `player/wallet.ts`, and records `quest.finished` with `recordEvent` from `player/events.ts`.
5. **The browser shows the result** the server sent back, and nothing else.

## The rules: `game/`

| Folder | What it holds |
|---|---|
| `game/world/` | The places, their layout and doors (`side-rooms.ts`), walking and dashing, the bus, the clock, the sky, and where the character stands. |
| `game/cards/` | The sets, boosters and their recipes (`booster.ts`), binders, duplicate coins, the pull tiers, the shop's prices and dialogue, coupons, and the card statistics' export. |
| `game/quests/` | One file per daily quest, the activity tracker and its bonus (`activity.ts`), the timing rules they share (`quests.ts`), and Papy Caillou's sayings (`proverbs.ts`). |
| `game/quests/shifts/` | The shifts: their shared rules and pay (`shifts.ts`), and one file per game, from Yuzu's three jobs to Flash's photos. |
| `game/avatar/` | The animals the player can walk about as (`species.ts`). |
| `game/log/` | The event log's catalogue (`events.ts`), the browser's reports, visits, and the statistics' periods. |
| `game/ui/` | Pure calculations that serve the interface rather than the rules: moving through menus with the keys (`menu-keys.ts`, `spatial-focus.ts`), the dialogue's typewriter and the counters' roll. |
| `game/` | What serves every domain: the seeded random numbers the games draw from (`seeded-random.ts`), and the "What's new?" notes (`news.ts`). |

Every rule has its test beside it, as `<name>.test.ts`. Helpers shared by several tests are `<name>.test-helpers.ts`.

## The display: `components/`

| Folder | What it holds |
|---|---|
| `components/game/game.tsx` | The game screen: ties every part together and keeps what they share, such as the wallet and who the player talks to. |
| `components/game/art/` | The drawings, made by code on canvases: `core.ts` for the shared tools, then one file per place with its characters, such as `dojo.ts`. |
| `components/game/scene/` | The paper diorama in Three.js: `paper-scene.tsx` sets it up and moves between places, `stage.tsx` holds what every place is built from, then one file per place, plus `sky.tsx`, `outdoors.tsx`, `pip.tsx` and the travel screen. |
| `components/game/hud/` | What lies over the scene: the top bar, the prompts and speech bubbles, the settings, the activity tracker, the news sheet, the controls legend, the joystick and the sleep screen. |
| `components/game/avatar/` | The animal the player walks about as, shared through `avatar-context.tsx`, and the bedroom's wardrobe to change it. |
| `components/game/shop/` | The sellers: conversations, shop windows and portraits. |
| `components/game/boosters/` | The booster bag, the opening and its effects, and the binder. |
| `components/game/quests/` | The quests' dialogs and games, one per quest outside the shifts. |
| `components/game/shifts/` | The shifts: their shared frame and logic (`shift.tsx`), the hosts' conversation (`shift-dialog.tsx`), and one scene per game. |
| `components/game/office/` | The administrative office: the statistics, the coupon register and the lift. |
| `components/auth/`, `components/brand/` | The sign-up, sign-in and password reset forms, and the icons and link previews. |

Hooks sit beside what they serve, such as `use-game-keys.ts` for the keyboard or `quests/use-kitten-hunt.ts` for Mme Ronron's kitten.

## The server

| Folder | What it holds |
|---|---|
| `player/` | Everything that changes a player's things, each in one transaction with its event: `wallet.ts` (coins, boosters and binders, shared by all), `shop.ts` (buying and opening), `progress.ts` (what the page loads), `activity.ts`, `avatar.ts`, `coupons.ts`, `visits.ts`. |
| `player/quests/` | One file per quest or family of quests, beside `attempts.ts`, which starts and finishes the attempts they all share and pays once a day. |
| `stats/` | The administrative office's statistics, from aggregate queries on the event log. |
| `cards/` | The card catalogue: importing it from TCGdex, the booster pools and the binders' contents. |
| `coupons/` | The coupons admins create. |
| `auth/` | Accounts, sessions and roles, and resetting a forgotten password (`password-reset.ts`). |
| `email/` | Sending emails: through Scaleway once it is set up, printed in the server's output otherwise, the look they share (`layout.ts`, with its banner drawn by `app/email-header.png/`), and each email's contents, such as `password-reset.ts`. |
| `db/` | The schema (`db/schema/`), its migrations (`db/migrations/`) and the client. |
| `app/api/` | The HTTP routes, one folder per action, each a thin layer over the modules above. |

## Elsewhere

| Path | What it holds |
|---|---|
| `app/[locale]/` | The pages, under the language in the URL. |
| `messages/` | Every player-facing text, in `en.json` and `fr.json`, which must have the same keys. |
| `i18n/` | The language routing. |
| `scripts/` | Command-line tools, such as `pnpm cards:import`. |
| `docs/` | This page. |

## Where a new piece goes

**A new daily quest.**
1. Its rules: `game/quests/<name>.ts` with its test, or `game/quests/shifts/<name>.ts` for a shift.
2. Its server side: a function in `player/quests/`, paying in its own transaction with the helpers of `player/wallet.ts` and `player/quests/attempts.ts`, and recording its event.
3. Its routes: `app/api/quests/<name>/`.
4. Its game: `components/game/quests/<name>-dialog.tsx`, or `components/game/shifts/<name>-scene.tsx` for a shift.
5. Its character: a drawing in `components/game/art/<place>.ts`, placed in `components/game/scene/<place>.tsx`, with its spot in `game/world/side-rooms.ts`.
6. Its texts in both files of `messages/`, its place in the activity tracker (`game/quests/activity.ts`), and its event types in `game/log/events.ts` if it needs new ones.

**A new place.** Its layout and doors in `game/world/side-rooms.ts`, its drawings in a new `components/game/art/<place>.ts`, and its scene in a new `components/game/scene/<place>.tsx`, mounted by `paper-scene.tsx`.

**A new dialog over the scene.** In the folder of its domain under `components/game/`, opened from `game.tsx`, following the focus rules of `components/game/menu-focus.ts`.

When a folder grows past a dozen files of one kind, it gets a subfolder of its own, as the shifts did.
