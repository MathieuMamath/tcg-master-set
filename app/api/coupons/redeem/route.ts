import { getPlayer } from '@/auth/session';
import { redeemCoupon } from '@/player/progress';

// A player uses a coupon from the settings. The server alone checks and pays it.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  if (typeof body?.code !== 'string') {
    return Response.json({ error: 'invalid-code' }, { status: 400 });
  }
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json(await redeemCoupon(player.id, body.code));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Redeeming the coupon failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'coupons-unavailable' }, { status: 503 });
  }
}
