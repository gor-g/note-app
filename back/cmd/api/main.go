package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

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

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	log.Println("server running on :8080")

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
