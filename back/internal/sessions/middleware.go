package sessions

import (
	"context"
	"net/http"
)

// contextKey is unexported so no other package can collide with our context key.
type contextKey string

const userIDKey contextKey = "userID"

// RequireAuth returns middleware that authenticates the session cookie and, on
// success, stores the user id in the request context for the wrapped handler.
// Unauthenticated requests get 401 and never reach the handler.
func RequireAuth(service *Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(cookieName)
			if err != nil {
				http.Error(w, "not authenticated", http.StatusUnauthorized)
				return
			}
			user, err := service.Authenticate(r.Context(), c.Value)
			if err != nil {
				http.Error(w, "not authenticated", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), userIDKey, user.ID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromContext returns the authenticated user's id that RequireAuth stored,
// or ("", false) if the request wasn't authenticated.
func UserIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(userIDKey).(string)
	return id, ok
}
