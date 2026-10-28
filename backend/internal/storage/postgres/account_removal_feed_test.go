package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type deletionTraceKey struct{}

type deletionQuery struct {
	started time.Time
	feed    bool
}

type deletionTrace struct {
	mu       sync.Mutex
	batches  int
	maxRows  int64
	maxTime  time.Duration
	sqlState string
}

func (tr *deletionTrace) TraceQueryStart(ctx context.Context, _ *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	return context.WithValue(ctx, deletionTraceKey{}, deletionQuery{
		started: time.Now(),
		feed:    strings.HasPrefix(data.SQL, "DELETE FROM feed_entries"),
	})
}

func (tr *deletionTrace) TraceQueryEnd(ctx context.Context, _ *pgx.Conn, data pgx.TraceQueryEndData) {
	query := ctx.Value(deletionTraceKey{}).(deletionQuery)
	if !query.feed {
		return
	}

	tr.mu.Lock()
	defer tr.mu.Unlock()
	tr.batches++
	tr.maxRows = max(tr.maxRows, data.CommandTag.RowsAffected())
	tr.maxTime = max(tr.maxTime, time.Since(query.started))
	var postgresError *pgconn.PgError
	if errors.As(data.Err, &postgresError) {
		tr.sqlState = postgresError.Code
	}
}

func TestMeetingDeletionLargeHistoryIntegration(t *testing.T) {
	db := integrationDB(t)
	trace := &deletionTrace{}
	config := db.pool.Config()
	config.ConnConfig.Tracer = trace
	pool, err := pgxpool.NewWithConfig(t.Context(), config)
	requireChatSQL(t, err)
	db.pool.Close()
	db.pool = pool
	store := db.Meetings()
	id := fmt.Sprintf("delete-history-%x", randBytes(12))
	other := id + "-other"
	t.Cleanup(func() {
		for _, meetingID := range []string{id, other} {
			requireChatSQL(t, store.Update(context.Background(), func(w meetings.Writer) error { return w.DeleteMeeting(meetingID) }))
		}
	})
	for _, meetingID := range []string{id, other} {
		requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
			return w.SaveMeeting(meetings.Meeting{ID: meetingID})
		}))
	}

	for first := 1; first <= 100000; first += 1000 {
		requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
			_, err := w.(*transaction).exec(`INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document)
			 SELECT $1||'-'||n,$1,n*2,'actor',n::text,jsonb_build_object(
			 'ID',$1||'-'||n,'MeetingID',$1,'Sequence',n*2,'Kind','message')
			 FROM generate_series($2::int,$3::int)n`, id, first, first+999)

			return err
		}))
	}

	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		tx := w.(*transaction)
		for _, meetingID := range []string{id, other} {
			if _, err := tx.exec(`INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document)
			 VALUES($1||'-max',$1,18446744073709551615,'actor','max',jsonb_build_object(
			 'ID',$1||'-max','MeetingID',$1,'Sequence',18446744073709551615::numeric,'Kind','message'))`, meetingID); err != nil {
				return err
			}

			if _, err := tx.exec(`INSERT INTO message_reactions(meeting_id,entry_id,user_id,emoji,document)
			 VALUES($1,$1||'-max','reader','heart','{}')`, meetingID); err != nil {
				return err
			}
		}

		return nil
	}))

	assertRows := func(meetingID string, entries int) {
		t.Helper()
		for _, check := range []struct {
			table string
			want  int
		}{{"feed_entries", entries}, {"message_reactions", 1}} {
			var count int
			err := db.pool.QueryRow(t.Context(), "SELECT count(*) FROM "+check.table+" WHERE meeting_id=$1", meetingID).Scan(&count)
			if err != nil || count != check.want {
				t.Fatalf("%s count=%d want=%d: %v", check.table, count, check.want, err)
			}
		}
	}
	rollback := errors.New("rollback entire meeting deletion")
	err = store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.DeleteMeeting(id); err != nil {
			return err
		}

		return rollback
	})
	if !errors.Is(err, rollback) {
		t.Fatalf("delete rollback: %v SQLSTATE=%s", err, trace.sqlState)
	}

	assertRows(id, 100001)
	assertRows(other, 1)
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error { return w.DeleteMeeting(id) }))
	assertRows(other, 1)
	for _, table := range []string{"feed_entries", "message_reactions"} {
		var count int
		requireChatSQL(t, db.pool.QueryRow(t.Context(), "SELECT count(*) FROM "+table+" WHERE meeting_id=$1", id).Scan(&count))
		if count != 0 {
			t.Fatalf("deleted meeting retained %s rows=%d", table, count)
		}
	}

	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		if _, err := r.Meeting(id); !errors.Is(err, meetings.ErrNotFound) {
			t.Fatal("deleted meeting retained", err)
		}

		_, err := r.Meeting(other)

		return err
	}))
	if trace.batches < 2 || trace.maxRows > 1000 || trace.sqlState != "" {
		t.Fatalf("unbounded or failed deletion: batches=%d max_rows=%d SQLSTATE=%s", trace.batches, trace.maxRows, trace.sqlState)
	}

	t.Logf("history=100001 sparse/max_uint64 rollback+commit batches=%d max_rows=%d max_statement_ms=%.3f", trace.batches, trace.maxRows, float64(trace.maxTime.Microseconds())/1000)
}
