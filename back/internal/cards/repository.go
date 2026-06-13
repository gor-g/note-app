package cards

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Upsert inserts a card blob, or overwrites the existing one with the same id,
// stamping a fresh updated_at. The ON CONFLICT guard only updates a row the same
// user already owns, so one user can never clobber another's card by id (and
// with client-generated UUIDs that collision is vanishingly unlikely anyway).
func (r *Repository) Upsert(ctx context.Context, userID, id, ciphertext string) (*CardBlob, error) {
	var b CardBlob
	err := r.db.QueryRow(ctx, `
		INSERT INTO cards (id, user_id, ciphertext, deleted, updated_at)
		VALUES ($1, $2, $3, false, now())
		ON CONFLICT (id) DO UPDATE
			SET ciphertext = excluded.ciphertext,
			    deleted = false,
			    updated_at = now()
			WHERE cards.user_id = excluded.user_id
		RETURNING id, ciphertext, deleted, updated_at
	`, id, userID, ciphertext).Scan(&b.ID, &b.Ciphertext, &b.Deleted, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// ListChangedSince returns the user's card blobs whose updated_at is newer than
// `since`, oldest change first. Passing the zero time returns everything — the
// initial full sync.
func (r *Repository) ListChangedSince(ctx context.Context, userID string, since time.Time) ([]CardBlob, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, ciphertext, deleted, updated_at
		FROM cards
		WHERE user_id = $1 AND updated_at > $2
		ORDER BY updated_at ASC
	`, userID, since)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	blobs := []CardBlob{}
	for rows.Next() {
		var b CardBlob
		if err := rows.Scan(&b.ID, &b.Ciphertext, &b.Deleted, &b.UpdatedAt); err != nil {
			return nil, err
		}
		blobs = append(blobs, b)
	}
	return blobs, rows.Err()
}

// Delete tombstones a card: the row stays (deleted = true, blob cleared) so
// other devices learn of the deletion on their next sync. Returns ErrNotFound
// if the user has no such card.
func (r *Repository) Delete(ctx context.Context, userID, id string) (*CardBlob, error) {
	var b CardBlob
	err := r.db.QueryRow(ctx, `
		UPDATE cards
		SET deleted = true, ciphertext = NULL, updated_at = now()
		WHERE id = $1 AND user_id = $2
		RETURNING id, ciphertext, deleted, updated_at
	`, id, userID).Scan(&b.ID, &b.Ciphertext, &b.Deleted, &b.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}
