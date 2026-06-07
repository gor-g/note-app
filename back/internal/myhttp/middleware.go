package myhttp

import (
	"bytes"
	"io"
	"log"
	"net/http"
)

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("error reading body: %v", err)
		}

		log.Printf("=== Incoming Request ===")
		log.Printf("Method: %s", r.Method)
		log.Printf("URL: %s", r.URL.String())
		log.Printf("Headers: %+v", r.Header)
		log.Printf("Body: %s", string(body))
		log.Printf("========================")

		// Recréer le body pour que le handler puisse encore le lire
		r.Body = io.NopCloser(bytes.NewBuffer(body))

		next.ServeHTTP(w, r)
	})
}
