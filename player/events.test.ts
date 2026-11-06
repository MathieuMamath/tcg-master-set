import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { GAME_EVENT_TYPES } from '@/game/events';

// Where events are recorded: what changes a player's things, the accounts, and the admins' coupons.
const RECORDING_FILES = ['player/progress.ts', 'auth/server.ts', 'coupons/admin.ts'];

const sources = RECORDING_FILES.map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join(
  '\n',
);

// A type of the catalogue that nothing records would leave a hole in the statistics, unnoticed.
test.each(GAME_EVENT_TYPES)('%s is recorded somewhere', (type) => {
  expect(sources).toContain(`'${type}'`);
});
