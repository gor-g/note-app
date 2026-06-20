// The review screen: walks the due cards one at a time. Tapping Remember or Not
// remember reveals the answer and records the result, which bumps or resets the
// card's streak and reschedules it (see review/schedule). Recording does not
// move on — the Previous / Next buttons handle that — and a calendar button can
// pin the next revision date by hand instead.

import { useEffect, useRef, useState } from "react";
import type { Card } from "../cards/card";
import { dueCards, sortByReviewOrder } from "../review/due";
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
  const [queue] = useState(() => sortByReviewOrder(dueCards(cards)));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which answer is currently chosen for this card, so its button can show as
  // active. Cleared when moving to another card.
  const [selected, setSelected] = useState<Recall | null>(null);
  // Which half of the card, if any, is expanded to fill the viewport for
  // distraction-free review, mirroring the editor's per-field full-screen toggle.
  const [fullField, setFullField] = useState<"question" | "answer" | null>(
    null,
  );

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

  // The corner button on a card half that expands it to fill the viewport, or
  // collapses it back. Shared by the question and answer so they behave alike.
  function renderExpandButton(field: "question" | "answer") {
    const isFull = fullField === field;
    return (
      <button
        type="button"
        className="review-fullscreen"
        onClick={() => setFullField(isFull ? null : field)}
        aria-label={isFull ? "Exit full screen" : "Expand to full screen"}
        title={isFull ? "Exit full screen" : "Full screen"}
      >
        {/* Four corners: pointing out to expand, pointing in to collapse. */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {isFull ? (
            <>
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </>
          ) : (
            <>
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M16 3h3a2 2 0 0 1 2 2v3" />
              <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
              <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
            </>
          )}
        </svg>
      </button>
    );
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
        <div
          className={
            "review-half" +
            (fullField === "question" ? " review-half-full" : "")
          }
        >
          {renderExpandButton("question")}
          <p className="review-question">{currentCard.question}</p>
        </div>
        {/* The answer block stays visible at all times (its divider reserves the
            space); only the text inside is hidden until the card is revealed. */}
        <div
          className={
            "review-answer" +
            (fullField === "answer" ? " review-half-full" : "")
          }
        >
          {renderExpandButton("answer")}
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
              "review-remember" +
              (selected === "remember" ? " is-selected" : "")
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
