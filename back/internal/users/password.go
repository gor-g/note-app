package users

import "golang.org/x/crypto/bcrypt"

type PasswordService struct{}

func (p PasswordService) Hash(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return "", err
    }
    return string(bytes), nil
}

func (p PasswordService) Compare(hash string, password string) error {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}