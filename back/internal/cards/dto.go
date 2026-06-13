package cards

import "time"

// CardBlob is the server's view of a card: an opaque, client-encrypted blob plus
// the bookkeeping sync needs. The server never sees plaintext — Ciphertext is
// the base64 AES-GCM blob produced in the browser (see the E2EE design in the
// project README), and is null for a tombstone.
type CardBlob struct {
	ID         string    `json:"id"`
	Ciphertext *string   `json:"ciphertext"` // null when Deleted
	Deleted    bool      `json:"deleted"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// "Upsert" = update-or-insert. The client doesn't know or care whether this card already exists on the server; it just sends the id + blob, and the server inserts a new row or overwrites the existing one with the same id. One code path handles both.
type UpsertCardInput struct {
	ID         string `json:"id"`
	Ciphertext string `json:"ciphertext"`
}
