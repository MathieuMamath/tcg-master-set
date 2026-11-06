import { beforeEach, expect, test, vi } from 'vitest';
import { isAdmin } from '@/auth/roles';
import { getPlayer } from '@/auth/session';
import { createCoupon, listCoupons } from '@/coupons/admin';
import { GET, POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/auth/roles', () => ({ isAdmin: vi.fn() }));
vi.mock('@/coupons/admin', () => ({ createCoupon: vi.fn(), listCoupons: vi.fn() }));

function create(body: unknown) {
  return POST(
    new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(createCoupon).mockReset();
  vi.mocked(listCoupons).mockResolvedValue([]);
  vi.mocked(getPlayer).mockResolvedValue({ id: 'admin-1', username: 'Placeholder' });
  vi.mocked(isAdmin).mockResolvedValue(true);
});

test('lists the coupons for an admin', async () => {
  const response = await GET();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ coupons: [] });
});

test('makes a coupon from a valid form', async () => {
  vi.mocked(createCoupon).mockResolvedValue(true);

  const response = await create({ code: 'welcome', coins: 500, boosters: 0 });

  expect(response.status).toBe(200);
  expect(createCoupon).toHaveBeenCalledWith(
    'admin-1',
    expect.objectContaining({ code: 'WELCOME' }),
  );
});

test('says why a form is refused, or that the code is taken', async () => {
  expect((await create({ code: 'NONE', coins: 0, boosters: 0 })).status).toBe(400);
  vi.mocked(createCoupon).mockResolvedValue(false);
  expect((await create({ code: 'TAKEN', coins: 5, boosters: 0 })).status).toBe(409);
});

test('refuses anyone but an admin', async () => {
  vi.mocked(isAdmin).mockResolvedValue(false);
  expect((await GET()).status).toBe(403);
  expect((await create({ code: 'GIFT', coins: 5, boosters: 0 })).status).toBe(403);
  vi.mocked(getPlayer).mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect(createCoupon).not.toHaveBeenCalled();
});
