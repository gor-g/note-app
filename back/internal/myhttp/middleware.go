package myhttp

import (
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware logs one line per request.
//
// SECURITY: it deliberately does NOT log request bodies or headers. The body of
// POST /users contains the user's plaintext password, and headers will soon
// carry auth tokens/cookies — logging either would leak credentials into log
// files (which are typically less protected than the database and often shipped
// to third-party aggregators). Logging the password would also defeat the whole
// point of bcrypt-hashing it before storage.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s from %s (%s)", r.Method, r.URL.Path, r.RemoteAddr, time.Since(start))
	})
}
