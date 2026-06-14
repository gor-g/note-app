// HTTP layer for the card endpoints. The blobs are opaque ciphertext — this
// layer never encrypts or decrypts, it only moves base64 strings to and from the
// server. Encryption lives in cards/cardStore.

import { request } from "./client";

// The server's view of a card (mirrors `CardBlob` in back/internal/cards/dto.go).
export interface CardBlob {
  id: string;
  ciphertext: string | null; // null for a tombstone
  deleted: boolean;
  updatedAt: string;
}

export interface UpsertCardInput {
  id: string;
  ciphertext: string;
}

interface CardsResponse {
  cards: CardBlob[];
}

export async function fetchCardBlobs(): Promise<CardBlob[]> {
  const response = await request<CardsResponse>("/cards");
  return response.cards;
}

export async function pushCardBlobs(
  cards: UpsertCardInput[],
): Promise<CardBlob[]> {
  const response = await request<CardsResponse>("/cards", {
    method: "PUT",
    body: { cards },
  });
  return response.cards;
}

export function deleteCardBlob(id: string): Promise<CardBlob> {
  return request<CardBlob>(`/cards/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
