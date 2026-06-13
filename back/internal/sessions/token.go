package sessions

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
)

// newToken returns a fresh, unguessable session token. 32 bytes from a
// cryptographically secure source gives 256 bits of entropy — not brute-forceable.
// base64url makes it safe to put in a cookie value.
func newToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// hashToken is what we actually persist. We never store the raw token, only its
// SHA-256 hash; on each request we hash the incoming cookie and look it up. A
// plain (unsalted) hash is fine here because the input already has full entropy,
// so dictionary/rainbow attacks don't apply (unlike with passwords).
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
