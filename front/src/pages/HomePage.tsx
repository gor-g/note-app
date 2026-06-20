import { useEffect, useMemo, useState } from "react";
import type { User } from "../api/auth";
import type { Card, NewCard } from "../cards/card";
import {
  cardMatchesQuery,
  createCard,
  deleteCard,
  loadCardsNewestFirst,
  saveCard,
} from "../cards/cardStore";
import { isDue } from "../review/due";
import { CardItem } from "../components/CardItem";
import { CardEditorPage } from "./CardEditorPage";
import { ReviewPage } from "./ReviewPage";

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

// Which screen is showing. Adding and editing share one editor screen; `card`
// is null when adding and the target card when editing, and `from` records the
// screen to return to when the editor closes (the list, or mid-review).
type View =
  | { kind: "list" }
  | { kind: "review" }
  | { kind: "editor"; card: Card | null; from: "list" | "review" };

export function HomePage({ user, onLogout }: HomePageProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "list" });

  const trimmedQuery = query.trim();
  // Non-matching cards are kept mounted and hidden (rather than removed), so
  // their expanded state survives a search.
  const visibleCardIds = useMemo(() => {
    const ids = new Set<string>();
    for (const card of cards) {
      if (cardMatchesQuery(card, trimmedQuery)) ids.add(card.id);
    }
    return ids;
  }, [cards, trimmedQuery]);

  const dueCount = useMemo(
    () => cards.reduce((count, card) => (isDue(card) ? count + 1 : count), 0),
    [cards],
  );

  // Every distinct tag in use, offered as choices in the editor. De-duplicated
  // case-insensitively, keeping the first spelling seen.
  const allTags = useMemo(() => {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const card of cards) {
      for (const tag of card.tags ?? []) {
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        tags.push(tag);
      }
    }
    return tags;
  }, [cards]);

  useEffect(() => {
    loadCardsNewestFirst()
      .then(setCards)
      .catch((e) => {
        setError("Could not load your cards.");
        console.log(e);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(
    values: NewCard,
    nextReviewAt: string | null,
    streak: number,
    priority: number,
    tags: string[],
  ) {
    const card = await createCard(values, nextReviewAt, streak, priority, tags);
    setCards((prev) => [card, ...prev]);
  }

  async function handleUpdate(updated: Card) {
    await saveCard(updated);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function handleDelete(id: string) {
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  if (view.kind === "review") {
    return (
      <ReviewPage
        cards={cards}
        onGrade={handleUpdate}
        onExit={() => setView({ kind: "list" })}
        onEditCard={(card) => setView({ kind: "editor", card, from: "review" })}
        onNewCard={() => setView({ kind: "editor", card: null, from: "review" })}
      />
    );
  }

  if (view.kind === "editor") {
    const target = view.card;
    const from = view.from;
    return (
      <CardEditorPage
        card={target}
        allTags={allTags}
        onCancel={() => setView({ kind: from })}
        onSubmit={async (values, nextReviewAt, streak, priority, tags) => {
          if (target)
            await handleUpdate({
              ...target,
              ...values,
              nextReviewAt,
              streak,
              priority,
              tags,
            });
          else
            await handleCreate(values, nextReviewAt, streak, priority, tags);
          setView({ kind: from });
        }}
      />
    );
  }

  return (
    <div className="home">
      <header className="home-header">
        <h2 className="home-title">Memonote</h2>
        <div className="home-account">
          {!loading && !error && (
            <button
              type="button"
              className="home-new"
              onClick={() => setView({ kind: "editor", card: null, from: "list" })}
            >
              New card
            </button>
          )}
          <span className="home-email">{user.email}</span>
          <button type="button" className="home-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="home-main">
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="auth-error">{error}</p>
        ) : (
          <>
            {dueCount > 0 && (
              <button
                type="button"
                className="review-start"
                onClick={() => setView({ kind: "review" })}
              >
                Review {dueCount} due {dueCount === 1 ? "card" : "cards"}
              </button>
            )}

            {cards.length === 0 ? (
              <p className="home-empty">No cards yet.</p>
            ) : (
              <div>
                <input
                  type="search"
                  className="card-search"
                  placeholder="Search cards…"
                  aria-label="Search cards"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                {visibleCardIds.size === 0 && (
                  <p className="home-empty">No matches.</p>
                )}

                <ul className="card-list">
                  {cards.map((card) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      hidden={!visibleCardIds.has(card.id)}
                      onEdit={(c) => setView({ kind: "editor", card: c, from: "list" })}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
