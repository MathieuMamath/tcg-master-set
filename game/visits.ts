// A visit to the game: each time its page is opened, and how long it stayed open. Recorded for the
// statistics only, as the browser reports it: a visit gives no advantage, so it isn't checked
// beyond its shape, and it holds nothing personal, only the kind of device and where the link
// came from, by its domain.

export const DEVICES = ['desktop', 'phone'] as const;
export type Device = (typeof DEVICES)[number];

export type Visit = { device: Device; referrer: string | null };

// Longer than any real session: a page left open overnight isn't a visit of that length.
export const MAX_VISIT_SECONDS = 6 * 60 * 60;
const MAX_REFERRER_LENGTH = 80;

// The domain a link came from, without its usual prefixes, or null for a visit that came from the
// game itself, typed in, or from an address that can't be read.
export function referrerDomain(referrer: unknown, ownHost: string): string | null {
  if (typeof referrer !== 'string' || referrer === '') {
    return null;
  }
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^(www|m)\./, '');
    const own = ownHost
      .toLowerCase()
      .replace(/^(www|m)\./, '')
      .replace(/:\d+$/, '');
    if (host === '' || host === own || host.length > MAX_REFERRER_LENGTH) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export function parseVisit(value: unknown, ownHost: string): Visit | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { device, referrer } = value as Record<string, unknown>;
  if (!DEVICES.includes(device as Device)) {
    return null;
  }
  return { device: device as Device, referrer: referrerDomain(referrer, ownHost) };
}

// How long a visit lasted, from its opening to now, or null when it can't be one visit.
export function visitSeconds(openedAt: Date, now: Date): number | null {
  const seconds = Math.round((now.getTime() - openedAt.getTime()) / 1000);
  return seconds >= 0 && seconds <= MAX_VISIT_SECONDS ? seconds : null;
}
