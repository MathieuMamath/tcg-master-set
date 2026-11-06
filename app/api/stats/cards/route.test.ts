import { beforeEach, expect, test, vi } from 'vitest';
import { isAdmin } from '@/auth/roles';
import { getPlayer } from '@/auth/session';
import { PLAYABLE_SET_IDS } from '@/game/card-sets';
import { loadSetDropOverview, loadSetDrops } from '@/stats/card-stats';
import { GET } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/auth/roles', () => ({ isAdmin: vi.fn() }));
vi.mock('@/stats/card-stats', () => ({ loadSetDropOverview: vi.fn(), loadSetDrops: vi.fn() }));

const SET = PLAYABLE_SET_IDS[0];

function read(query: string) {
  return GET(new Request(`http://localhost/api/stats/cards${query}`));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(loadSetDropOverview).mockReset();
  vi.mocked(loadSetDrops).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
  vi.mocked(isAdmin).mockResolvedValue(true);
});

test('gives an admin the overview of every set', async () => {
  vi.mocked(loadSetDropOverview).mockResolvedValue([
    { setId: SET, boosters: 3, versionsPulled: 12 },
  ]);

  const response = await read('');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    sets: [{ setId: SET, boosters: 3, versionsPulled: 12 }],
  });
});

test("gives an admin one set's cards in their language", async () => {
  vi.mocked(loadSetDrops).mockResolvedValue({ setName: 'Placeholder', boosters: 3, drops: [] });

  const response = await read(`?set=${SET}&locale=fr`);

  expect(response.status).toBe(200);
  expect(loadSetDrops).toHaveBeenCalledWith(SET, 'fr');
});

test('refuses an unknown set or language', async () => {
  expect((await read('?set=nope&locale=fr')).status).toBe(400);
  expect((await read(`?set=${SET}&locale=xx`)).status).toBe(400);
  expect(loadSetDrops).not.toHaveBeenCalled();
});

test('refuses a player who is not an admin, or a visitor', async () => {
  vi.mocked(isAdmin).mockResolvedValue(false);
  expect((await read('')).status).toBe(403);
  vi.mocked(getPlayer).mockResolvedValue(null);
  expect((await read('')).status).toBe(401);
  expect(loadSetDropOverview).not.toHaveBeenCalled();
});

test('hides a failure behind a 503', async () => {
  vi.mocked(loadSetDropOverview).mockRejectedValue(new Error('database down'));

  expect((await read('')).status).toBe(503);
});
