package users

import "time"

type UserDTO struct {
    ID           string    `json:"id"`
    Email        string    `json:"email"`
    CreatedAt    time.Time `json:"createdAt"`
}

type CreateUserInput struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}