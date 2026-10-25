// Command migrate applies embedded migrations using a dedicated database role.
package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/storage/postgres"
)

func main() {
	businessMetrics := flag.Bool("business-metrics", false, "Enable persistent aggregate business metrics after application migrations")
	flag.Parse()

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	db, err := postgres.Open(ctx, os.Getenv("SOMEWHERE_DATABASE_URL"))
	if err == nil {
		defer db.Close()
		err = db.Migrate(ctx)
		if err == nil && *businessMetrics {
			err = db.EnableBusinessMetrics(ctx)
		}
	}

	if err != nil {
		slog.Error("database migration failed")
		os.Exit(1)
	}

	slog.Info("database migration complete")
}
