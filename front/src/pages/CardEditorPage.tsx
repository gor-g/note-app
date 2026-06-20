// A full screen for adding a new card or editing an existing one. Reached from
// the home screen's "New card" button (card === null) or a card's Edit button
// (card set). The actual fields live in CardForm; this page frames them with a
// title, a back/cancel control, and a calendar button for pinning the next
// revision date.

import { useState } from "react";
import type { Card, NewCard } from "../cards/card";
import { CardForm } from "../components/CardForm";
import { RevisionDateButton } from "../components/RevisionDateButton";
import { PriorityButton } from "../components/PriorityButton";

interface CardEditorPageProps {
  // The card being edited, or null when adding a new one.
  card: Card | null;
  onSubmit: (
    values: NewCard,
    nextReviewAt: string | null,
    streak: number,
    priority: number,
  ) => Promise<void>;
  onCancel: () => void;
}

export function CardEditorPage({ card, onSubmit, onCancel }: CardEditorPageProps) {
  const editing = card !== null;
  // Seeded from the card so an unchanged edit re-saves the same schedule; the
  // calendar button updates both together (a date implies a streak level).
  const [nextReviewAt, setNextReviewAt] = useState<string | null>(
    card?.nextReviewAt ?? null,
  );
  const [streak, setStreak] = useState(card?.streak ?? 0);
  // 5 is the default priority for a card with none set (new card or an older
  // card saved before the field existed).
  const [priority, setPriority] = useState(card?.priority ?? 5);

  function handlePickDate(iso: string, level: number) {
    setNextReviewAt(iso);
    setStreak(level);
  }

  return (
    <div className="editor">
      <header className="editor-header">
        <button type="button" className="editor-back" onClick={onCancel}>
          ← Back
        </button>
        <h2 className="editor-title">{editing ? "Edit card" : "New card"}</h2>
        <PriorityButton value={priority} onChange={setPriority} />
        <RevisionDateButton onChange={handlePickDate} />
      </header>

      <main className="editor-main">
        <CardForm
          initialValues={
            card ? { question: card.question, answer: card.answer } : undefined
          }
          submitLabel={editing ? "Save" : "Add card"}
          onSubmit={(values) => onSubmit(values, nextReviewAt, streak, priority)}
        />
      </main>
    </div>
  );
}
