// The review screen: walks the due cards one at a time. Tapping Remember or Not
// remember reveals the answer and records the result, which bumps or resets the
// card's streak and reschedules it (see review/schedule). Recording does not
// move on — the Previous / Next buttons handle that — and a calendar button can
// pin the next revision date by hand instead.

import { useEffect, useRef, useState } from "react";
import type { Card } from "../cards/card";
import { dueCards } from "../review/due";
import { updateCardAfterReview, type Recall } from "../review/schedule";
import { RevisionDateButton } from "../components/RevisionDateButton";

interface ReviewPageProps {
  cards: Card[];
  onGrade: (card: Card) => Promise<void>;
  onExit: () => void;
  // Open the editor on the card being reviewed, or on a blank new card. Both
  // return here when the editor closes.
  onEditCard: (card: Card) => void;
  onNewCard: () => void;
}

export function ReviewPage({
  cards,
  onGrade,
  onExit,
  onEditCard,
  onNewCard,
}: ReviewPageProps) {
  // Snapshot the due cards once, when the session starts, so the queue doesn't
  // shift under the user as cards get rescheduled. Navigation through it is
  // manual (Previous / Next).
  const [queue] = useState(() => dueCards(cards));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which answer is currently chosen for this card, so its button can show as
  // active. Cleared when moving to another card.
  const [selected, setSelected] = useState<Recall | null>(null);

  const currentCard = queue[index];

  console.log(cards);

  // The streak each card had when the session began. Grading always recomputes
  // from this base rather than the card's latest value, so toggling a card from
  // "not remember" back to "remember" restores its old streak (+1) instead of
  // building up from the reset 0, and re-tapping the same answer never stacks.
  const baseStreaks = useRef<Map<string, number> | null>(null);
  if (baseStreaks.current === null) {
    baseStreaks.current = new Map(queue.map((c) => [c.id, c.streak ?? 0]));
  }

  // The streak is no longer shown on the card; log it for debugging instead.
  useEffect(() => {
    if (currentCard) console.log("Card streak:", currentCard.streak ?? 0);
  }, [currentCard]);

  function goToCard(nextIndex: number) {
    setRevealed(false);
    setSelected(null);
    setIndex(nextIndex);
  }

  // Saves the result/schedule but stays on the card; moving on is the user's job.
  async function commit(updated: Card) {
    setError(null);
    setSaving(true);
    try {
      await onGrade(updated);
    } catch {
      // A failed save keeps us on the card so nothing is lost.
      setError("Could not save your review.");
    } finally {
      setSaving(false);
    }
  }

  // Each tap reveals the answer and records the result, bumping the streak on
  // "remember" or resetting it on "forgot". Both grade from the card's
  // session-start streak (see baseStreaks), so a "remember" always restores the
  // base + 1, even after a "not remember" reset it to 0.
  function handleRecall(recall: Recall) {
    setRevealed(true);
    setSelected(recall);
    const base =
      baseStreaks.current?.get(currentCard.id) ?? currentCard.streak ?? 0;
    const updated = updateCardAfterReview(
      { ...currentCard, streak: base },
      recall,
    );
    console.log("Card streak:", updated.streak);
    commit(updated);
  }

  if (queue.length === 0) {
    return (
      <div className="review">
        <p className="home-empty">No cards are due for review.</p>
        <button type="button" className="review-exit" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="review">
        <p className="home-empty">
          Review complete — {queue.length}{" "}
          {queue.length === 1 ? "card" : "cards"} reviewed.
        </p>
        <button type="button" className="review-exit" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="review">
      <div className="review-bar">
        <button type="button" className="review-exit" onClick={onExit}>
          ← Go back
        </button>
        <span className="review-progress">
          {index + 1} / {queue.length}
        </span>
        <div className="review-bar-actions">
          <RevisionDateButton
            onChange={(iso, streak) =>
              commit({
                ...currentCard,
                streak,
                lastShownAt: new Date().toISOString(),
                nextReviewAt: iso,
              })
            }
          />
          <button
            type="button"
            className="review-exit"
            onClick={() => onEditCard(currentCard)}
          >
            Edit
          </button>
          <button type="button" className="review-exit" onClick={onNewCard}>
            New
          </button>
        </div>
      </div>

      <div className="review-card">
        <p className="review-question">{currentCard.question}</p>
        {/* The answer block stays visible at all times (its divider reserves the
            space); only the text inside is hidden until the card is revealed. */}
        <div className="review-answer">
          <span className="review-answer-text" hidden={!revealed}>
            {currentCard.answer}
          </span>
        </div>
      </div>

      <div className="review-controls">
        <div className="review-grades">
          <button
            type="button"
            className={
              "review-remember" + (selected === "remember" ? " is-selected" : "")
            }
            onClick={() => handleRecall("remember")}
            disabled={saving}
          >
            Remember
          </button>
          <button
            type="button"
            className={
              "review-forgot" + (selected === "forgot" ? " is-selected" : "")
            }
            onClick={() => handleRecall("forgot")}
            disabled={saving}
          >
            Not remember
          </button>
        </div>

        {/* Navigation is separate from grading. Next can step past the last card
            to the "review complete" screen. */}
        <div className="review-nav">
          <button
            type="button"
            onClick={() => goToCard(index - 1)}
            disabled={index === 0}
          >
            ← Previous
          </button>
          <button type="button" onClick={() => goToCard(index + 1)}>
            Next →
          </button>
        </div>
      </div>

      {error && <p className="card-error">{error}</p>}
    </div>
  );
}
