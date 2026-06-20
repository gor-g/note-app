// A single memo card, as the app works with it in memory (plaintext). It is
// encrypted into an opaque blob before being sent to the server, so the server
// never sees these fields (see the E2EE notes in the project README).

export interface Card {
  id: string;
  question: string;
  answer: string;

  // User-set review priority from 0 (lowest) to 10 (highest); defaults to 5.
  // Cards created before this field existed may lack it, so read defensively
  // with `?? 5`.
  priority: number;

  // ISO-8601 string rather than a Date, so it matches the wire format and sorts
  // chronologically without timezone surprises.
  createdAt: string;

  // Review scheduling (see review/schedule). `streak` is the number of
  // consecutive "remember"s; it indexes the interval ladder, and "not remember"
  // resets it to 0.
  streak: number;
  lastShownAt: string | null;
  // null means "due now": never scheduled, e.g. a freshly created card.
  nextReviewAt: string | null;
}

// The fields the user supplies when creating a card; the rest are filled in by
// createCard (see cards/cardStore).
export type NewCard = Pick<Card, "question" | "answer">;
