import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { BEDROOM_START } from '@/game/bedroom';
import { savePlayerSpot } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ savePlayerSpot: vi.fn() }));

const SPOT = { place: 'bedroom', ...BEDROOM_START };

function save(body: unknown) {
  return POST(
    new Request('http://test.invalid/api/player/spot', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(savePlayerSpot).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('saves the spot of the signed-in player', async () => {
  const response = await save(SPOT);

  expect(response.status).toBe(204);
  expect(savePlayerSpot).toHaveBeenCalledWith('player-1', SPOT);
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await save(SPOT)).status).toBe(401);
  expect(savePlayerSpot).not.toHaveBeenCalled();
});

test('rejects a spot where the character could not stand', async () => {
  expect((await save({ ...SPOT, x: 1000 })).status).toBe(400);
  expect(savePlayerSpot).not.toHaveBeenCalled();
});

test('rejects a body that is not JSON', async () => {
  const response = await POST(
    new Request('http://test.invalid/api/player/spot', { method: 'POST', body: 'nope' }),
  );

  expect(response.status).toBe(400);
});

test('hides database errors from the player', async () => {
  vi.mocked(savePlayerSpot).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await save(SPOT);

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
