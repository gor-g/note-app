package sessions

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO sessions (token_hash, user_id, expires_at)
		VALUES ($1, $2, $3)
	`, tokenHash, userID, expiresAt)
	return err
}

// sessionUser is the result of joining a session back to its owner — enough to
// answer "who is this request from?" in a single query.
type sessionUser struct {
	UserID    string
	Email     string
	CreatedAt time.Time
	ExpiresAt time.Time
}

func (r *Repository) GetUserByTokenHash(ctx context.Context, tokenHash string) (*sessionUser, error) {
	var su sessionUser
	err := r.db.QueryRow(ctx, `
		SELECT u.id, u.email, u.created_at, s.expires_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = $1
	`, tokenHash).Scan(&su.UserID, &su.Email, &su.CreatedAt, &su.ExpiresAt)
	// token_hash is the PRIMARY KEY of the sessions table. So uniqueness isn't just probabilistic - Postgres won't allow a duplicate.
	if err != nil {
		return nil, err
	}
	return &su, nil
}

func (r *Repository) Delete(ctx context.Context, tokenHash string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM sessions WHERE token_hash = $1`, tokenHash)
	return err
}
