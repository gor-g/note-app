import type { Card } from "../cards/card";

export function isDue(card: Card, now: Date = new Date()): boolean {
  if (!card.nextReviewAt) return true;
  return new Date(card.nextReviewAt) <= now;
}

export function dueCards(cards: Card[], now: Date = new Date()): Card[] {
  return cards.filter((card) => isDue(card, now));
}
