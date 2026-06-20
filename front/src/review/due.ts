import type { Card } from "../cards/card";

export function isDue(card: Card, now: Date = new Date()): boolean {
  if (!card.nextReviewAt) return true;
  return new Date(card.nextReviewAt) <= now;
}

// Selects the cards that are due for review (unscheduled or past their date).
export function dueCards(cards: Card[], now: Date = new Date()): Card[] {
  return cards.filter((card) => isDue(card, now));
}

// When a card is due. null ("due now", e.g. a fresh card) is treated as the
// current moment, so it sorts after cards whose date is actually in the past.
function dueTime(card: Card, now: Date): number {
  return card.nextReviewAt
    ? new Date(card.nextReviewAt).getTime()
    : now.getTime();
}

// Orders cards for review: priority outranks the due date, so a higher-priority
// card always comes first; ties fall back to the most overdue (earliest due
// date). `?? 5` covers cards saved before priority existed. Returns a new array
// rather than sorting in place.
export function sortByReviewOrder(
  cards: Card[],
  now: Date = new Date(),
): Card[] {
  return [...cards].sort((a, b) => {
    const byPriority = (b.priority ?? 5) - (a.priority ?? 5);
    if (byPriority !== 0) return byPriority;
    return dueTime(a, now) - dueTime(b, now);
  });
}
