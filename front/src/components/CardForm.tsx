// A form for a card's question and answer, used by the card editor page for both
// creating a new card (blank, "Add card") and editing an existing one
// (pre-filled, "Save"). It owns the field state and busy/error handling but
// delegates what to do with the values to the parent via `onSubmit`.

import { useState, type FormEvent } from "react";
import type { NewCard } from "../cards/card";

interface CardFormProps {
  initialValues?: NewCard;
  onSubmit: (values: NewCard) => Promise<void>;
  submitLabel?: string;
}

export function CardForm({
  initialValues,
  onSubmit,
  submitLabel = "Add card",
}: CardFormProps) {
  const [question, setQuestion] = useState(initialValues?.question ?? "");
  const [answer, setAnswer] = useState(initialValues?.answer ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which field, if any, is expanded to fill the viewport for focused editing.
  const [fullscreenField, setFullscreenField] = useState<
    "question" | "answer" | null
  >(null);

  function swapSides() {
    setQuestion(answer);
    setAnswer(question);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Trim and require both halves: the native `required` attribute only rejects
    // an empty string, so whitespace-only input would slip past it.
    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();
    if (!trimmedQuestion || !trimmedAnswer) {
      setError("Both a question and an answer are required.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ question: trimmedQuestion, answer: trimmedAnswer });
      // Reset to the starting point: blank for create, original values for edit.
      setQuestion(initialValues?.question ?? "");
      setAnswer(initialValues?.answer ?? "");
    } catch {
      setError("Could not save the card.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(
    name: "question" | "answer",
    value: string,
    onChange: (next: string) => void,
    placeholder: string,
  ) {
    const isFull = fullscreenField === name;
    return (
      <div className={isFull ? "card-field card-field-full" : "card-field"}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          required
        />
        <button
          type="button"
          className="card-fullscreen"
          onClick={() => setFullscreenField(isFull ? null : name)}
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
      </div>
    );
  }

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      {/* The two fields fill the screen and nearly touch; the swap button floats
          over the seam between them. */}
      <div className="card-fields">
        {renderField("question", question, setQuestion, "Question")}

        <button
          type="button"
          className="card-swap"
          onClick={swapSides}
          disabled={submitting}
          aria-label="Swap question and answer"
          title="Swap question and answer"
        >
          {/* Two opposite vertical arrows, mirroring the stacked fields. */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 20V4M8 4 4 8M8 4l4 4" />
            <path d="M16 4v16M16 20l-4-4M16 20l4-4" />
          </svg>
        </button>

        {renderField("answer", answer, setAnswer, "Answer")}
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
