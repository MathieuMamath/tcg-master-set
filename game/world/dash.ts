const DASH_SECONDS = 0.25;

// How much time is left of the dash.
export type DashState = { remaining: number };

export const NO_DASH: DashState = { remaining: 0 };

export const DASH_SPEED_FACTOR = 4;

// Every request starts a full dash at once, so that the player can spam them.
export function tickDash(dash: DashState, isRequested: boolean, delta: number): DashState {
  return { remaining: isRequested ? DASH_SECONDS : Math.max(dash.remaining - delta, 0) };
}
