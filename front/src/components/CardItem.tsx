// One memo card in a list. Clicking the question reveals/hides the answer; the
// pencil button opens the card editor page (via onEdit), and the trash button
// removes it after a confirm. Each card owns its own reveal/delete state.

import { useState } from "react";
import type { Card } from "../cards/card";

interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => Promise<void>;
  // Hide the card (e.g. search filtered it out) without unmounting it, so its
  // reveal state is preserved for when it comes back.
  hidden?: boolean;
}

export function CardItem({ card, onEdit, onDelete, hidden }: CardItemProps) {
  const [revealed, setRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("Delete this card? This cannot be undone.")) return;
    setError(null);
    setDeleting(true);
    try {
      await onDelete(card.id);
      // On success the parent unmounts this card, so there's no state to reset.
    } catch {
      setError("Could not delete the card.");
      setDeleting(false);
    }
  }

  return (
    <li className="card-item" hidden={hidden}>
      {/* Left column: the edit / delete actions. */}
      <div className="card-actions">
        <button
          type="button"
          className="card-edit"
          onClick={() => onEdit(card)}
          disabled={deleting}
          aria-label="Edit card"
          title="Edit"
        >
          {/* Pencil */}
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </button>
        <button
          type="button"
          className="card-delete"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={deleting ? "Deleting card" : "Delete card"}
          title={deleting ? "Deleting…" : "Delete"}
        >
          {/* Trash can */}
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
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      {/* Right column: the question header, its revealed answer, and any error. */}
      <div className="card-body">
        {/* A real <button> (not a clickable <div>) so the toggle is keyboard- and
            screen-reader-accessible for free; `aria-expanded` announces whether
            the answer is currently shown. */}
        <button
          type="button"
          className="card-question"
          aria-expanded={revealed}
          onClick={() => setRevealed((r) => !r)}
        >
          {card.question}
        </button>

        {/* Hidden with display:none rather than added/removed, so toggling never
            re-creates the node. */}
        <p className="card-answer" hidden={!revealed}>
          {card.answer}
        </p>

        {error && <p className="card-error">{error}</p>}
      </div>
    </li>
  );
}
