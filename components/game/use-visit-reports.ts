import { type RefObject, useEffect } from 'react';
import { LANDING_REFERRER_KEY } from '@/components/landing-referrer';
import type { PlayerSpot } from '@/game/world/spot';
import { reportPlay } from './report';
import type { Talk } from './talk';

// Set once this page has reported its visit, so that a remount doesn't count it twice.
let isVisitRecorded = false;

// What the game tells the event log about the visit: its opening, each conversation that starts,
// and its end, along with where the character stands when the page is left.
export function useVisitReports(
  locale: string,
  talkingTo: Talk | null,
  spot: RefObject<PlayerSpot | null>,
) {
  // Each opening of the page is a visit, for the statistics: once per page, even if the game
  // mounts twice, with the kind of device and where the tab first came from.
  useEffect(() => {
    if (isVisitRecorded) {
      return;
    }
    isVisitRecorded = true;
    let referrer = document.referrer;
    try {
      referrer = sessionStorage.getItem(LANDING_REFERRER_KEY) || referrer;
      // Once counted, a reload of the game is no longer a visit from that link.
      sessionStorage.setItem(LANDING_REFERRER_KEY, '');
    } catch {
      // Without storage, the page's own referrer will do.
    }
    const device = window.matchMedia('(pointer: coarse)').matches ? 'phone' : 'desktop';
    fetch('/api/player/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, device, referrer }),
    }).catch(() => {});
  }, [locale]);

  // Each conversation that starts, for the statistics. Papy's skipping stones and Bérénice's
  // Pop'Balloons carry on theirs.
  useEffect(() => {
    if (talkingTo !== null && talkingTo !== 'grandpaStones' && talkingTo !== 'bereniceBalloons') {
      reportPlay({ type: 'npc.talked', speaker: talkingTo });
    }
  }, [talkingTo]);

  // Leaving the page saves where the character stands and closes the visit, by beacons that
  // outlive the page.
  useEffect(() => {
    const saveOnLeave = () => {
      navigator.sendBeacon('/api/player/visit/end');
      if (spot.current) {
        navigator.sendBeacon(
          '/api/player/spot',
          new Blob([JSON.stringify(spot.current)], { type: 'application/json' }),
        );
      }
    };
    window.addEventListener('pagehide', saveOnLeave);
    return () => window.removeEventListener('pagehide', saveOnLeave);
  }, [spot]);
}
