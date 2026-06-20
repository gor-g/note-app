// A filter button for the card list / review queue: pick tags to narrow to.
// Reuses the tag picker's popup styling, but it only chooses among existing
// tags (no search/create) and a card matches if it has any of the picked tags.

import { useState } from "react";

interface TagFilterButtonProps {
  // Every tag that exists across all cards.
  allTags: string[];
  // Tags currently filtered on.
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilterButton({
  allTags,
  selected,
  onChange,
}: TagFilterButtonProps) {
  const [open, setOpen] = useState(false);

  const options = [...allTags].sort((a, b) => a.localeCompare(b));

  function isOn(tag: string) {
    return selected.some((t) => t.toLowerCase() === tag.toLowerCase());
  }

  function toggle(tag: string) {
    onChange(
      isOn(tag)
        ? selected.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...selected, tag],
    );
  }

  return (
    <div className="tag-picker">
      <button
        type="button"
        className={"tag-picker-button" + (selected.length > 0 ? " is-active" : "")}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Filter by tag (${selected.length} selected)`}
        title="Filter by tag"
      >
        {/* Tag */}
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
          <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <span>Tags</span>
        {selected.length > 0 && (
          <span className="tag-picker-count">{selected.length}</span>
        )}
      </button>

      {/* Transparent backdrop closes the popup on an outside click. */}
      <div
        className="tag-picker-overlay"
        hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div
        className="tag-picker-popover"
        role="dialog"
        aria-label="Filter by tag"
        hidden={!open}
      >
        <div className="tag-filter-head">
          <span className="tag-picker-label">Filter by tag</span>
          {selected.length > 0 && (
            <button
              type="button"
              className="tag-filter-clear"
              onClick={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>

        <div className="tag-picker-list">
          {options.map((tag) => {
            const checked = isOn(tag);
            return (
              <button
                key={tag.toLowerCase()}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                className={"tag-picker-item" + (checked ? " is-selected" : "")}
                onClick={() => toggle(tag)}
              >
                <span className="tag-picker-check" aria-hidden="true">
                  {checked ? "✓" : ""}
                </span>
                {tag}
              </button>
            );
          })}
          {options.length === 0 && (
            <span className="tag-picker-empty">No tags yet</span>
          )}
        </div>
      </div>
    </div>
  );
}
