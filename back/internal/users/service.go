package users

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

type Service struct {
	repo     *Repository
	password PasswordService
}

func NewService(repo *Repository) *Service {
	return &Service{
		repo:     repo,
		password: PasswordService{},
	}
}

func (s *Service) CreateUser(ctx context.Context, input CreateUserInput) (*UserDTO, error) {
	if input.Email == "" || input.Password == "" {
		return nil, errors.New("email and password required")
	}

	existing, _ := s.repo.GetByEmail(ctx, input.Email)
	if existing != nil {
		return nil, errors.New("user already exists")
	}

	id := uuid.NewString()

	hash, err := s.password.Hash(input.Password)
	if err != nil {
		return nil, err
	}

	row, err := s.repo.Create(ctx, id, input.Email, hash)
	if err != nil {
		return nil, err
	}

	return &UserDTO{
		ID:        row.ID,
		Email:     row.Email,
		CreatedAt: row.CreatedAt,
	}, nil
}
