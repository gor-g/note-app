// Review scheduling. Each card carries a `streak`: the number of times in a row
// it was remembered. "remember" bumps the streak by one, "not remember" resets
// it to 0. The streak indexes the interval ladder below (capped at its last
// entry) to decide when the card is next due — from "right now" up to a year.

import type { Card } from "../cards/card";

export type Recall = "remember" | "forgot";

const HOUR = 60;
const DAY = 24 * HOUR;

export interface ReviewInterval {
  label: string;
  minutes: number;
}

// The interval ladder, from "due now" up to a year. A card's streak indexes this
// list (capped at the last entry) to pick its next-review delay. The same list
// is the only set of dates the manual date picker offers, so a hand-set date
// always lines up with a streak level.
export const REVIEW_INTERVALS: ReviewInterval[] = [
  { label: "Now", minutes: 0 },
  { label: "In 2 hours", minutes: 2 * HOUR },
  { label: "In 4 hours", minutes: 4 * HOUR },
  { label: "In 24 hours", minutes: 24 * HOUR },
  { label: "In 2 days", minutes: 2 * DAY },
  { label: "In 4 days", minutes: 4 * DAY },
  { label: "In 7 days", minutes: 7 * DAY },
  { label: "In 2 weeks", minutes: 14 * DAY },
  { label: "In a month", minutes: 30 * DAY },
  { label: "In 2 months", minutes: 60 * DAY },
  { label: "In 4 months", minutes: 120 * DAY },
  { label: "In a year", minutes: 365 * DAY },
];

export function updateCardAfterReview(
  card: Card,
  recall: Recall,
  now: Date = new Date(),
): Card {
  // `?? 0` covers cards created before the streak field existed.
  const streak = recall === "remember" ? (card.streak ?? 0) + 1 : 0;
  const { minutes } =
    REVIEW_INTERVALS[Math.min(streak, REVIEW_INTERVALS.length - 1)];
  const dueAt = new Date(now.getTime() + minutes * 60 * 1000);

  return {
    ...card,
    streak,
    lastShownAt: now.toISOString(),
    nextReviewAt: dueAt.toISOString(),
  };
}
