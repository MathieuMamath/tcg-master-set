import { isAdmin } from '@/auth/roles';
import { getPlayer } from '@/auth/session';
import { createCoupon, listCoupons, setCouponActive } from '@/coupons/admin';
import { parseCouponActivation, parseCouponDraft } from '@/game/cards/coupons';

// Mlle Trotte's register, for admins only, checked on every request: Brutus at the door is only a
// picture of this rule.
async function admin() {
  const player = await getPlayer();
  if (!player) {
    return { error: Response.json({ error: 'not-signed-in' }, { status: 401 }) };
  }
  if (!(await isAdmin(player.id))) {
    return { error: Response.json({ error: 'not-an-admin' }, { status: 403 }) };
  }
  return { player };
}

function unavailable(error: unknown) {
  // Logged as text: the full error object carries the database client's internals.
  console.error(
    'The coupons failed:',
    String(error instanceof Error ? (error.cause ?? error) : error),
  );
  return Response.json({ error: 'coupons-unavailable' }, { status: 503 });
}

export async function GET() {
  try {
    const checked = await admin();
    if (checked.error) {
      return checked.error;
    }
    return Response.json({ coupons: await listCoupons() });
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const parsed = parseCouponDraft(await request.json().catch(() => null), new Date());
  try {
    const checked = await admin();
    if (checked.error) {
      return checked.error;
    }
    if ('error' in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    if (!(await createCoupon(checked.player.id, parsed.draft))) {
      return Response.json({ error: 'taken' }, { status: 409 });
    }
    return Response.json({ coupons: await listCoupons() });
  } catch (error) {
    return unavailable(error);
  }
}

// Turns a coupon off, or back on. It stays in the register with its uses either way.
export async function PATCH(request: Request) {
  const parsed = parseCouponActivation(await request.json().catch(() => null));
  try {
    const checked = await admin();
    if (checked.error) {
      return checked.error;
    }
    if (!parsed) {
      return Response.json({ error: 'invalid' }, { status: 400 });
    }
    await setCouponActive(checked.player.id, parsed.couponId, parsed.isActive);
    return Response.json({ coupons: await listCoupons() });
  } catch (error) {
    return unavailable(error);
  }
}
