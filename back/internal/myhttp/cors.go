package myhttp

import "net/http"

// CORSMiddleware lets the browser-based frontend (served from a different
// origin, e.g. http://localhost:5173) call this API.
//
// Why this is needed: browsers enforce the Same-Origin Policy. When JS on
// origin A calls an API on origin B, the browser only exposes the response to
// the page if the API explicitly opts in via Access-Control-* headers. Without
// them the request is blocked client-side — even though the server processed it
// fine (which is why curl still works). For any "unsafe" request (POST with a
// JSON content-type) the browser also sends a preflight OPTIONS request first,
// which we must answer.
//
// `allowedOrigin` is passed in (rather than hardcoded) so it can be set per
// environment — never use "*" together with credentials, and don't ship a
// permissive localhost value to production.
func CORSMiddleware(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		// Required for the browser to send/receive the session cookie on
		// cross-origin requests. Note: with credentials the origin must be an
		// explicit value (never "*"), which is why allowedOrigin is configured.
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		// Tell caches the response varies by Origin (important once more than
		// one origin is allowed).
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Preflight request: answer it directly with 204 and don't run the
		// actual handler.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
