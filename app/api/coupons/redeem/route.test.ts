import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { redeemCoupon } from '@/player/coupons';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/coupons', () => ({ redeemCoupon: vi.fn() }));

function redeem(body: unknown) {
  return POST(
    new Request('http://localhost/api/coupons/redeem', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(redeemCoupon).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test("passes the typed code on, and sends back the server's answer", async () => {
  vi.mocked(redeemCoupon).mockResolvedValue({ status: 'alreadyUsed' });

  const response = await redeem({ code: 'bienvenue' });

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'alreadyUsed' });
  expect(redeemCoupon).toHaveBeenCalledWith('player-1', 'bienvenue');
});

test('refuses a request without a code, or a visitor', async () => {
  expect((await redeem({})).status).toBe(400);
  vi.mocked(getPlayer).mockResolvedValue(null);
  expect((await redeem({ code: 'X' })).status).toBe(401);
  expect(redeemCoupon).not.toHaveBeenCalled();
});
