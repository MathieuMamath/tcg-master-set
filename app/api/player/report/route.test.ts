import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { recordReport } from '@/player/visits';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/visits', () => ({ recordReport: vi.fn() }));

function report(body: unknown) {
  return POST(
    new Request('http://localhost/api/player/report', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(recordReport).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('records a valid report', async () => {
  const response = await report({ type: 'npc.talked', speaker: 'berenice' });

  expect(response.status).toBe(204);
  expect(recordReport).toHaveBeenCalledWith('player-1', {
    type: 'npc.talked',
    details: { speaker: 'berenice' },
  });
});

test('refuses an unknown report', async () => {
  expect((await report({ type: 'coins.found', amount: 9999 })).status).toBe(400);
  expect(recordReport).not.toHaveBeenCalled();
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await report({ type: 'npc.talked', speaker: 'berenice' })).status).toBe(401);
  expect(recordReport).not.toHaveBeenCalled();
});
