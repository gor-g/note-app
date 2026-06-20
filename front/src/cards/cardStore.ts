// Card storage backed directly by the server. Every operation hits the network:
// reads fetch and decrypt all of the user's blobs, writes encrypt and upload a
// single card. There is no local cache, so the app always reflects the server.
//
// Cards are end-to-end encrypted here with the in-memory session key, so the
// server only ever sees ciphertext.

import { sessionKey } from "../crypto/session";
import type { Cipher } from "../crypto/cipher";
import { deleteCardBlob, fetchCardBlobs, pushCardBlobs } from "../api/cards";
import type { Card, NewCard } from "./card";
import { fuzzyMatch } from "../util";

function requireCipher(): Cipher {
  const cipher = sessionKey.get();
  if (!cipher) {
    throw new Error("encryption key is unavailable; the user must log in");
  }
  return cipher;
}

export async function loadAllCards(): Promise<Card[]> {
  const cipher = requireCipher();
  const blobs = await fetchCardBlobs();

  const cards: Card[] = [];
  for (const blob of blobs) {
    // Tombstones come back as deleted blobs with no ciphertext; skip them.
    if (blob.deleted || blob.ciphertext === null) continue;
    const decrypted = await cipher.decrypt(blob.ciphertext);
    cards.push(JSON.parse(decrypted) as Card);
  }
  return cards;
}

export async function saveCard(card: Card): Promise<void> {
  const cipher = requireCipher();
  const ciphertext = await cipher.encrypt(JSON.stringify(card));
  await pushCardBlobs([{ id: card.id, ciphertext }]);
}

export async function createCard(
  input: NewCard,
  nextReviewAt: string | null = null,
  streak = 0,
  priority = 5,
  tags: string[] = [],
): Promise<Card> {
  const card: Card = {
    id: crypto.randomUUID(),
    question: input.question,
    answer: input.answer,
    priority,
    tags,
    createdAt: new Date().toISOString(),
    // A new card has never been shown. It's due immediately by default
    // (nextReviewAt null = "due now") unless the editor pinned a date/streak.
    streak,
    lastShownAt: null,
    nextReviewAt,
  };
  await saveCard(card);
  return card;
}

export async function deleteCard(id: string): Promise<void> {
  await deleteCardBlob(id);
}

export function cardMatchesQuery(card: Card, query: string): boolean {
  if (query === "") return true;
  return fuzzyMatch(query, card.question) || fuzzyMatch(query, card.answer);
}

// Tag and priority filters applied to the card list and the review queue alike.
export interface CardFilter {
  // Tags to require, matched case-insensitively. A card passes if it carries any
  // of these (OR); empty means no tag filter.
  tags: string[];
  // The card's priority must be at least this; 0 lets everything through.
  minPriority: number;
}

export function cardMatchesFilter(card: Card, filter: CardFilter): boolean {
  if ((card.priority ?? 5) < filter.minPriority) return false;
  if (filter.tags.length > 0) {
    const cardTags = new Set((card.tags ?? []).map((t) => t.toLowerCase()));
    if (!filter.tags.some((t) => cardTags.has(t.toLowerCase()))) return false;
  }
  return true;
}

// The server returns cards in `id` order (random UUIDs), so newest-first has to
// be imposed here.
export async function loadCardsNewestFirst(): Promise<Card[]> {
  const loaded = await loadAllCards();
  return loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
