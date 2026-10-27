package postgres

import (
	"context"
	"fmt"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestChatMigrationPreservesLegacyMeetingIntegration(t *testing.T) {
	db := integrationDB(t)
	schema := fmt.Sprintf("chat_upgrade_%x", randBytes(8))
	quoted := pgx.Identifier{schema}.Sanitize()
	_, err := db.pool.Exec(t.Context(), "CREATE SCHEMA "+quoted)
	requireChatSQL(t, err)
	defer func() {
		_, err := db.pool.Exec(context.Background(), "DROP SCHEMA "+quoted+" CASCADE")
		requireChatSQL(t, err)
	}()
	config := db.pool.Config().Copy()
	config.ConnConfig.RuntimeParams["search_path"] = schema
	pool, err := pgxpool.NewWithConfig(t.Context(), config)
	requireChatSQL(t, err)
	upgrade := &Database{pool: pool}
	defer upgrade.Close()
	_, err = pool.Exec(t.Context(), "CREATE TABLE schema_migrations(version integer PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())")
	requireChatSQL(t, err)
	for version := 1; version <= 3; version++ {
		_, err = pool.Exec(t.Context(), migrations[version-1], pgx.QueryExecModeSimpleProtocol)
		requireChatSQL(t, err)
		_, err = pool.Exec(t.Context(), "INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)", version, migrationChecksum(version))
		requireChatSQL(t, err)
	}

	requireChatSQL(t, upgrade.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: "legacy", Title: "Preserved"}); err != nil {
			return err
		}

		_, err := w.AppendEntry(meetings.FeedEntry{ID: "legacy-message", MeetingID: "legacy", Kind: "message", Payload: []byte(`{"text":"preserved"}`)})

		return err
	}))
	requireChatSQL(t, upgrade.Migrate(t.Context()))
	var epoch string
	requireChatSQL(t, upgrade.Meetings().View(t.Context(), func(r meetings.Reader) error {
		stream, err := r.ChatStream("legacy")
		if err != nil {
			return err
		}

		epoch = stream.Epoch
		if epoch == "" || stream.LatestSequence != 0 || stream.RetainedAfter != 0 {
			t.Fatal("migration stream", stream)
		}

		meeting, err := r.Meeting("legacy")
		if err != nil {
			return err
		}

		if meeting.Title != "Preserved" {
			t.Fatal("legacy meeting changed")
		}

		page, err := r.FeedWindow("legacy", meetings.FeedQuery{Limit: 1})
		if err == nil && (len(page.Entries) != 1 || page.Entries[0].ID != "legacy-message") {
			t.Fatal("legacy feed changed", page)
		}

		return err
	}))
	requireChatSQL(t, upgrade.Migrate(t.Context()))
	requireChatSQL(t, upgrade.Check(t.Context()))
	requireChatSQL(t, upgrade.Meetings().View(t.Context(), func(r meetings.Reader) error {
		stream, err := r.ChatStream("legacy")
		if err == nil && stream.Epoch != epoch {
			t.Fatal("migration replay rotated epoch")
		}

		return err
	}))
}
