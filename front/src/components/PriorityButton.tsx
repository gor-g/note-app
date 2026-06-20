// A flag-icon button that opens a popover for setting a card's review priority,
// 0 (lowest) to 10 (highest). Used in the card editor header, alongside the
// revision-date button. The button shows the current value; picking one reports
// it back via onChange and closes the popover.

import { useState } from "react";

interface PriorityButtonProps {
  value: number;
  onChange: (priority: number) => void;
}

// 0..10 inclusive.
const PRIORITIES = Array.from({ length: 11 }, (_, i) => i);

export function PriorityButton({ value, onChange }: PriorityButtonProps) {
  const [open, setOpen] = useState(false);

  function pick(priority: number) {
    onChange(priority);
    setOpen(false);
  }

  return (
    <div className="priority-picker">
      <button
        type="button"
        className="priority-picker-button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Set priority (currently ${value})`}
        title="Set priority"
      >
        {/* Flag */}
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
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span className="priority-picker-value">{value}</span>
      </button>

      {/* Transparent full-screen backdrop: a click anywhere outside the menu
          closes it. Kept in the DOM and toggled via `hidden`, not unmounted. */}
      <div
        className="priority-picker-overlay"
        hidden={!open}
        onClick={() => setOpen(false)}
      />

      {/* Hidden via the `hidden` attribute rather than unmounted. */}
      <div className="priority-picker-popover" role="menu" hidden={!open}>
        <span className="priority-picker-label">Priority</span>
        {PRIORITIES.map((priority) => (
          <button
            key={priority}
            type="button"
            role="menuitemradio"
            aria-checked={priority === value}
            className={priority === value ? "is-selected" : undefined}
            onClick={() => pick(priority)}
          >
            {priority}
          </button>
        ))}
      </div>
    </div>
  );
}
