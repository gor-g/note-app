// A calendar-icon button that opens a popover for setting a card's next revision
// date. Used in the review bar and the card editor. The choices are exactly the
// streak interval ladder (see review/schedule), so a hand-set date always lands
// on one of the dates the streak system itself would produce. Picking reports
// back both the date (ISO) and the streak level it corresponds to — the index
// into the ladder.

import { useState } from "react";
import { REVIEW_INTERVALS } from "../review/schedule";

interface RevisionDateButtonProps {
  onChange: (iso: string, streak: number) => void;
}

export function RevisionDateButton({ onChange }: RevisionDateButtonProps) {
  const [open, setOpen] = useState(false);

  function pick(streak: number) {
    const dueAt = new Date(Date.now() + REVIEW_INTERVALS[streak].minutes * 60 * 1000);
    onChange(dueAt.toISOString(), streak);
    setOpen(false);
  }

  return (
    <div className="date-picker">
      <button
        type="button"
        className="date-picker-button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Set next revision date"
        title="Set next revision date"
      >
        {/* Calendar */}
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
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {/* Hidden via the `hidden` attribute rather than unmounted. */}
      <div className="date-picker-popover" role="menu" hidden={!open}>
        <span className="date-picker-label">Display again</span>
        {REVIEW_INTERVALS.map((interval, streak) => (
          <button
            key={interval.label}
            type="button"
            role="menuitem"
            onClick={() => pick(streak)}
          >
            {interval.label}
          </button>
        ))}
      </div>
    </div>
  );
}
