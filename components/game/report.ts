// Tells the server how the player plays, for the statistics only: nothing waits for the answer,
// and a report that fails is simply let go.
export function reportPlay(
  report:
    | { type: 'npc.talked'; speaker: string }
    | { type: 'shop.viewed'; stock: string }
    | { type: 'binder.viewed'; setId: string }
    | { type: 'booster.abandoned'; setId: string },
) {
  fetch('/api/player/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  }).catch(() => {});
}
