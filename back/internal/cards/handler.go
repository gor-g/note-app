package cards

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/gor-g/note-app/back/internal/sessions"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes wires the sync endpoints behind `requireAuth`, so each handler
// can assume an authenticated user id in the request context.
func (h *Handler) RegisterRoutes(mux *http.ServeMux, requireAuth func(http.Handler) http.Handler) {
	mux.Handle("GET /cards", requireAuth(http.HandlerFunc(h.List)))
	mux.Handle("PUT /cards", requireAuth(http.HandlerFunc(h.Upsert)))
	mux.Handle("DELETE /cards/{id}", requireAuth(http.HandlerFunc(h.Delete)))
}

type cardsResponse struct {
	Cards []CardBlob `json:"cards"`
}

type upsertRequest struct {
	Cards []UpsertCardInput `json:"cards"`
}

// List returns the user's blobs changed strictly after the `since` cursor (an
// RFC3339 timestamp). Omitting `since` returns everything — the initial sync.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := sessions.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "not authenticated", http.StatusUnauthorized)
		return
	}

	var since time.Time
	if raw := r.URL.Query().Get("since"); raw != "" {
		t, err := time.Parse(time.RFC3339Nano, raw)
		if err != nil {
			http.Error(w, "invalid since", http.StatusBadRequest)
			return
		}
		since = t
	}

	blobs, err := h.service.ChangedSince(r.Context(), userID, since)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, cardsResponse{Cards: blobs})
}

// Upsert stores a batch of blobs and returns each with its server updated_at.
func (h *Handler) Upsert(w http.ResponseWriter, r *http.Request) {
	userID, ok := sessions.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "not authenticated", http.StatusUnauthorized)
		return
	}

	var req upsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	blobs, err := h.service.Upsert(r.Context(), userID, req.Cards)
	if errors.Is(err, ErrCardIDRequired) {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, cardsResponse{Cards: blobs})
}

// Delete tombstones a card and returns the tombstone blob (for its updated_at).
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := sessions.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "not authenticated", http.StatusUnauthorized)
		return
	}

	blob, err := h.service.Delete(r.Context(), userID, r.PathValue("id"))
	if errors.Is(err, ErrNotFound) {
		http.Error(w, "card not found", http.StatusNotFound)
		return
	}
	if errors.Is(err, ErrCardIDRequired) {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, blob)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}
