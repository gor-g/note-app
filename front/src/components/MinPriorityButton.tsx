// A filter button for the card list / review queue: pick a minimum priority,
// 0 (no filter) to 10. Reuses the priority picker's popup styling, so it looks
// and behaves like the editor's priority control, but the chosen number is a
// floor rather than an exact value.

import { useState } from "react";

interface MinPriorityButtonProps {
  // The current minimum; 0 means "any priority".
  value: number;
  onChange: (min: number) => void;
}

// 0..10 inclusive (0 = no filter).
const PRIORITIES = Array.from({ length: 11 }, (_, i) => i);

export function MinPriorityButton({ value, onChange }: MinPriorityButtonProps) {
  const [open, setOpen] = useState(false);

  function pick(min: number) {
    onChange(min);
    setOpen(false);
  }

  return (
    <div className="priority-picker">
      <button
        type="button"
        className={
          "priority-picker-button" + (value > 0 ? " is-active" : "")
        }
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          value > 0 ? `Minimum priority ${value}` : "Filter by minimum priority"
        }
        title="Minimum priority"
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
        <span className="priority-picker-value">
          {value > 0 ? `≥ ${value}` : "Any"}
        </span>
      </button>

      {/* Transparent backdrop closes the popup on an outside click. */}
      <div
        className="priority-picker-overlay"
        hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div className="priority-picker-popover" role="menu" hidden={!open}>
        <span className="priority-picker-label">Min priority</span>
        {PRIORITIES.map((min) => (
          <button
            key={min}
            type="button"
            role="menuitemradio"
            aria-checked={min === value}
            className={min === value ? "is-selected" : undefined}
            onClick={() => pick(min)}
          >
            {min === 0 ? "Any" : min}
          </button>
        ))}
      </div>
    </div>
  );
}
