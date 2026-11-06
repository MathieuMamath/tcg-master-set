import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { recordVisit } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ recordVisit: vi.fn() }));

function visit(body: unknown) {
  return POST(
    new Request('http://game.example/api/player/visit', {
      method: 'POST',
      headers: { host: 'game.example' },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(recordVisit).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('records the visit with the domain it came from only', async () => {
  const response = await visit({
    locale: 'fr',
    device: 'phone',
    referrer: 'https://discord.com/channels/1/2',
  });

  expect(response.status).toBe(204);
  expect(recordVisit).toHaveBeenCalledWith('player-1', 'fr', {
    device: 'phone',
    referrer: 'discord.com',
  });
});

test('refuses an unknown device or language', async () => {
  expect((await visit({ locale: 'fr', device: 'fridge' })).status).toBe(400);
  expect((await visit({ locale: 'xx', device: 'desktop' })).status).toBe(400);
  expect(recordVisit).not.toHaveBeenCalled();
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await visit({ locale: 'fr', device: 'desktop' })).status).toBe(401);
  expect(recordVisit).not.toHaveBeenCalled();
});
