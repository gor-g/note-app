package sessions

import (
	"context"
	"errors"
	"time"

	"github.com/gor-g/note-app/back/internal/users"
)

// Returned for any bad login. Deliberately vague — we never tell the caller
// whether it was the email or the password that was wrong, to avoid confirming
// which emails are registered.
var ErrInvalidCredentials = errors.New("invalid email or password")

// Returned when a session cookie is missing, unknown, or expired.
var ErrUnauthenticated = errors.New("not authenticated")

type Service struct {
	repo      *Repository
	users     *users.Repository
	password  users.PasswordService
	ttl       time.Duration
	dummyHash string
}

func NewService(repo *Repository, userRepo *users.Repository, ttl time.Duration) *Service {
	pw := users.PasswordService{}
	// Precompute a throwaway bcrypt hash. When someone tries to log in with an
	// email that doesn't exist, we still run a comparison against this so the
	// request takes about the same time as a real one — otherwise the response
	// time would reveal whether an email is registered (timing-based user
	// enumeration).
	dummy, _ := pw.Hash("placeholder-for-constant-time-login")
	return &Service{
		repo:      repo,
		users:     userRepo,
		password:  pw,
		ttl:       ttl,
		dummyHash: dummy,
	}
}

// CurrentUser is the safe-to-expose view of a user (no password hash).
type CurrentUser struct {
	ID        string
	Email     string
	CreatedAt time.Time
}

// Login verifies credentials and, on success, creates a session. It returns the
// raw token (to be put in a cookie) and the user.
func (s *Service) Login(ctx context.Context, email, password string) (string, *CurrentUser, error) {
	u, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		// No such user. Burn comparable time so the failure is indistinguishable
		// from a wrong password, then return the same vague error.
		_ = s.password.Compare(s.dummyHash, password)
		return "", nil, ErrInvalidCredentials
	}

	if err := s.password.Compare(u.PasswordHash, password); err != nil {
		return "", nil, ErrInvalidCredentials
	}

	token, err := newToken()
	if err != nil {
		return "", nil, err
	}
	if err := s.repo.Create(ctx, hashToken(token), u.ID, time.Now().Add(s.ttl)); err != nil {
		return "", nil, err
	}

	return token, &CurrentUser{ID: u.ID, Email: u.Email, CreatedAt: u.CreatedAt}, nil
}

// Authenticate resolves a raw session token to its user, or fails if the token
// is unknown or expired.
func (s *Service) Authenticate(ctx context.Context, token string) (*CurrentUser, error) {
	su, err := s.repo.GetUserByTokenHash(ctx, hashToken(token))
	if err != nil {
		return nil, ErrUnauthenticated
	}
	if time.Now().After(su.ExpiresAt) {
		// Opportunistically clean up the expired row.
		_ = s.repo.Delete(ctx, hashToken(token))
		return nil, ErrUnauthenticated
	}
	return &CurrentUser{ID: su.UserID, Email: su.Email, CreatedAt: su.CreatedAt}, nil
}

// Logout deletes the session server-side so the token can never be used again,
// even if the cookie lingers somewhere.
func (s *Service) Logout(ctx context.Context, token string) error {
	return s.repo.Delete(ctx, hashToken(token))
}
