'use client';

import { useEffect } from 'react';

// Where the tab first came from, kept until the game reads it for the statistics of its visit: a
// link shared in Discord usually lands on the sign-in page first, which the game's page wouldn't
// know of. Only kept for this tab, and only its domain is ever recorded.
export const LANDING_REFERRER_KEY = 'landing-referrer';

export function LandingReferrer() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(LANDING_REFERRER_KEY) === null) {
        sessionStorage.setItem(LANDING_REFERRER_KEY, document.referrer);
      }
    } catch {
      // Without storage, the game falls back on its own page's referrer.
    }
  }, []);
  return null;
}
