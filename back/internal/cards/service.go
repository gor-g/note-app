package cards

import (
	"context"
	"errors"
	"time"
)

// ErrNotFound is returned when an operation targets a card the user doesn't have.
var ErrNotFound = errors.New("card not found")

// ErrCardIDRequired is a client/validation error (missing id), distinguished
// from internal failures so the handler can answer 400 rather than 500.
var ErrCardIDRequired = errors.New("card id required")

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Upsert writes a batch of card blobs for the user and returns each stored blob
// with its server-stamped updated_at. The blobs are written one at a time; a
// failure stops the batch, but upserts are idempotent so the client can safely
// retry from its cursor.
func (s *Service) Upsert(ctx context.Context, userID string, inputs []UpsertCardInput) ([]CardBlob, error) {
	blobs := make([]CardBlob, 0, len(inputs))
	for _, in := range inputs {
		if in.ID == "" {
			return nil, ErrCardIDRequired
		}
		b, err := s.repo.Upsert(ctx, userID, in.ID, in.Ciphertext)
		if err != nil {
			return nil, err
		}
		blobs = append(blobs, *b)
	}
	return blobs, nil
}

// ChangedSince returns the user's card blobs changed after `since` (the zero
// time meaning "everything"), for the sync pull.
func (s *Service) ChangedSince(ctx context.Context, userID string, since time.Time) ([]CardBlob, error) {
	return s.repo.ListChangedSince(ctx, userID, since)
}

// Delete tombstones one of the user's cards.
func (s *Service) Delete(ctx context.Context, userID, id string) (*CardBlob, error) {
	if id == "" {
		return nil, ErrCardIDRequired
	}
	return s.repo.Delete(ctx, userID, id)
}
