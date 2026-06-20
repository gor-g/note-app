// A tag-icon button that opens a popup for tagging a card. The popup is a
// centred modal over a transparent overlay (same pattern as PriorityButton): a
// search line on top whose trailing + button creates a new tag, above a
// vertical list of every known tag as a checkbox that toggles membership for
// this card.
//
// Tag names are matched case-insensitively, so a created name must be unique
// regardless of case (no "Work" alongside "work").

import { useMemo, useState } from "react";

interface TagButtonProps {
  // The tags currently on the card.
  selected: string[];
  // Every tag that already exists across all cards, to choose from.
  available: string[];
  onChange: (tags: string[]) => void;
}

export function TagButton({ selected, available, onChange }: TagButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Tags created in this popup session, merged into the list so they appear
  // immediately even before the card is saved (and persisted into `available`).
  const [created, setCreated] = useState<string[]>([]);

  // All choices, de-duplicated case-insensitively and sorted. Includes the
  // card's own tags and anything created this session.
  const options = useMemo(() => {
    const seen = new Set<string>();
    const all: string[] = [];
    for (const tag of [...available, ...selected, ...created]) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(tag);
    }
    return all.sort((a, b) => a.localeCompare(b));
  }, [available, selected, created]);

  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();
  const filtered = options.filter((tag) => tag.toLowerCase().includes(needle));
  // A new tag can be created only when something non-empty is typed and no
  // existing tag already has that (trimmed, case-insensitive) name.
  const exists = options.some((tag) => tag.toLowerCase() === needle);
  const canCreate = trimmed !== "" && !exists;

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

  function create() {
    if (!canCreate) return;
    setCreated((prev) => [...prev, trimmed]);
    onChange([...selected, trimmed]);
    setQuery("");
  }

  return (
    <div className="tag-picker">
      <button
        type="button"
        className="tag-picker-button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Edit tags (${selected.length} selected)`}
        title="Edit tags"
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
        {selected.length > 0 && (
          <span className="tag-picker-count">{selected.length}</span>
        )}
      </button>

      {/* Transparent backdrop: a click outside the popup closes it. Kept in the
          DOM and toggled via `hidden`, not unmounted. */}
      <div
        className="tag-picker-overlay"
        hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div
        className="tag-picker-popover"
        role="dialog"
        aria-label="Tags"
        hidden={!open}
      >
        {/* Search line: filters the list, and its + button creates the typed
            tag when the name is non-empty and not already taken. */}
        <div className="tag-picker-search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                create();
              }
            }}
            placeholder="Search or add a tag"
            aria-label="Search or add a tag"
          />
          <button
            type="button"
            className="tag-picker-add"
            onClick={create}
            disabled={!canCreate}
            aria-label="Create tag"
            title={exists ? "Tag already exists" : "Create tag"}
          >
            +
          </button>
        </div>

        <div className="tag-picker-list">
          {filtered.map((tag) => {
            const checked = isOn(tag);
            return (
              <button
                key={tag.toLowerCase()}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                className={
                  "tag-picker-item" + (checked ? " is-selected" : "")
                }
                onClick={() => toggle(tag)}
              >
                <span className="tag-picker-check" aria-hidden="true">
                  {checked ? "✓" : ""}
                </span>
                {tag}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <span className="tag-picker-empty">
              {options.length === 0 ? "No tags yet" : "No matching tags"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
