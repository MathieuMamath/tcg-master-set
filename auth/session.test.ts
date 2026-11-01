import { headers } from 'next/headers';
import { beforeEach, expect, test, vi } from 'vitest';
import { getAuth } from './server';
import { getPlayer } from './session';

vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('./server', () => ({ getAuth: vi.fn() }));

function signedInAs(user: object | null) {
  vi.mocked(getAuth).mockReturnValue({
    api: { getSession: async () => (user ? { user } : null) },
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(headers).mockResolvedValue(new Headers() as never);
});

// During the build, reading the headers is how Next.js finds out that a page is dynamic. The
// build has no secrets, so that has to happen before anything needs them.
test('reads the request headers before creating the auth instance', async () => {
  const buildSignal = new Error('Dynamic server usage');
  vi.mocked(headers).mockRejectedValue(buildSignal);

  await expect(getPlayer()).rejects.toBe(buildSignal);
  expect(getAuth).not.toHaveBeenCalled();
});

test('returns nobody without a session', async () => {
  signedInAs(null);

  expect(await getPlayer()).toBeNull();
});

test('returns the player, with the username as they typed it', async () => {
  signedInAs({ id: 'player-1', name: 'placeholder', displayUsername: 'PlaceHolder' });

  expect(await getPlayer()).toEqual({ id: 'player-1', username: 'PlaceHolder' });
});
