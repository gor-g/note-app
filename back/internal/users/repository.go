package users

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

type userRow struct {
	ID           string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
}

type UserRow struct {
	ID        string
	Email     string
	CreatedAt time.Time
}

func (r *Repository) Create(ctx context.Context, id string, email string, passwordHash string) (*UserRow, error) {
	var row UserRow

	err := r.db.QueryRow(ctx, `
		INSERT INTO users (id, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, email, created_at
	`, id, email, passwordHash).Scan(
		&row.ID,
		&row.Email,
		&row.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &row, nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (*userRow, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, created_at
		FROM users
		WHERE email = $1
	`, email)

	var u userRow
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &u, nil
}
