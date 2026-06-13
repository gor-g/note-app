package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gor-g/note-app/back/internal/myhttp"
	"github.com/gor-g/note-app/back/internal/users"
)

func main() {
	ctx := context.Background()

	dbURL := os.Getenv("DATABASE_URL")

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal("cannot connect to db:", err)
	}
	defer pool.Close()

	pool.Config().MaxConns = 10
	pool.Config().MaxConnLifetime = time.Hour

	// --- USERS MODULE ---
	userRepo := users.NewRepository(pool)
	userService := users.NewService(userRepo)
	userHandler := users.NewHandler(userService)

	mux := http.NewServeMux()

	userHandler.RegisterRoutes(mux)

	// Origin the browser frontend is served from. Required: rather than guess a
	// default (which could silently allow the wrong origin in production), crash
	// so misconfiguration is obvious. The run scripts export this.
	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		log.Fatal("FRONTEND_ORIGIN is not set")
	}

	// Middleware wraps outermost-first: CORS sees the request before logging.
	handler := myhttp.CORSMiddleware(frontendOrigin, myhttp.LoggingMiddleware(mux))

	server := &http.Server{
		Addr:    ":8081",
		Handler: handler,
	}

	log.Println("server running on :8081")

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
