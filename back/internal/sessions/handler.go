package sessions

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

// Name of the session cookie. The value is the raw token; the browser stores it
// HttpOnly so page JavaScript can never read it.
const cookieName = "session"

type Handler struct {
	service *Service
	ttl     time.Duration
}

func NewHandler(service *Service, ttl time.Duration) *Handler {
	return &Handler{service: service, ttl: ttl}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /sessions", h.Login)    // log in
	mux.HandleFunc("DELETE /sessions", h.Logout) // log out
	mux.HandleFunc("GET /me", h.Me)              // who am I (restore session)
}

type loginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var in loginInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	token, user, err := h.service.Login(r.Context(), in.Email, in.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			http.Error(w, "invalid email or password", http.StatusUnauthorized)
			return
		}
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	h.setSessionCookie(w, token)
	writeUser(w, user)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// Best-effort: if there's a cookie, invalidate the session server-side.
	if c, err := r.Cookie(cookieName); err == nil {
		_ = h.service.Logout(r.Context(), c.Value)
	}
	h.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(cookieName)
	if err != nil {
		http.Error(w, "not authenticated", http.StatusUnauthorized)
		return
	}

	user, err := h.service.Authenticate(r.Context(), c.Value)
	if err != nil {
		// Stale/invalid cookie: clear it so the browser stops sending it.
		h.clearSessionCookie(w)
		http.Error(w, "not authenticated", http.StatusUnauthorized)
		return
	}

	writeUser(w, user)
}

func (h *Handler) setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,                 // not readable by JavaScript (XSS-resistant)
		Secure:   true,                 // only sent over HTTPS (localhost is a secure origin in dev on browsers other than safari)
		SameSite: http.SameSiteLaxMode, // not sent on cross-site requests (CSRF-resistant)
		Expires:  time.Now().Add(h.ttl),
		MaxAge:   int(h.ttl.Seconds()),
	})
}

// And here's the key reason it has to be done this way: the cookie is HttpOnly, so the
// frontend JavaScript literally cannot delete it (document.cookie can't see or touch it).
// The server's Set-Cookie is the only thing that can remove it - which is precisely why
// logout is a server round-trip rather than just setUser(null).
func (h *Handler) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1, // delete now
	})
}

func writeUser(w http.ResponseWriter, u *CurrentUser) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(userResponse{ID: u.ID, Email: u.Email, CreatedAt: u.CreatedAt})
}
