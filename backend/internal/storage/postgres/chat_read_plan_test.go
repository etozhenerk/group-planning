package postgres

import (
	"encoding/json"
	"fmt"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatReadState100kPlanIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	store := db.Meetings()
	owner, guest, newcomer := id+"-owner", id+"-guest", id+"-new"
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id, OrganizerID: owner}); err != nil {
			return err
		}

		if err := w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: guest, Answer: meetings.Going}); err != nil {
			return err
		}

		return w.InitializeChatReadMarkers(now)
	}))
	for start := 1; start <= 100000; start += 1000 {
		requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
			_, err := w.(*transaction).exec(`INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document) SELECT $1||'-'||n,$1,n,$4,n::text,jsonb_build_object('ID',$1||'-'||n,'MeetingID',$1,'Sequence',n,'ActorID',$4::text,'Kind','message','Payload',jsonb_build_object('text','fixture')) FROM generate_series($2::int,$3::int)n`, id, start, start+999, owner)
			return err
		}))
	}

	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error {
		return w.SaveRSVP(meetings.RSVP{MeetingID: id, UserID: newcomer, Answer: meetings.Going})
	}))
	started := time.Now()
	requireChatSQL(t, store.Update(t.Context(), func(w meetings.Writer) error { return w.InitializeChatReadMarkers(now) }))
	t.Logf("activation history=100000 current_members=3 elapsed_ms=%.3f", float64(time.Since(started).Microseconds())/1000)
	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		m, err := r.ChatReadMarker(id, newcomer)
		if err != nil {
			return err
		}

		if m.Baseline != 100000 || m.ReadThrough != 0 {
			t.Fatal("activation receipt", m)
		}

		state, err := r.ChatReadState(id, guest)
		if err == nil && (state.Baseline != 0 || state.UnreadCount != 100000 || state.FirstUnread != id+"-1") {
			t.Fatal("unread aggregate", state)
		}

		return err
	}))
	_, err := db.pool.Exec(t.Context(), "ANALYZE feed_entries; ANALYZE meeting_read_markers")
	requireChatSQL(t, err)
	ids := make([]string, 100)
	for i := range ids {
		ids[i] = fmt.Sprintf("%s-%d", id, len(ids)-i)
	}

	requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
		counts, err := r.ChatReceiptCounts(id, owner, ids)
		if err != nil {
			return err
		}

		if len(counts) != len(ids) {
			t.Fatalf("batch returned %d of %d requested entries", len(counts), len(ids))
		}

		for i, count := range counts {
			if count.EntryID != ids[i] || count.ReaderCount != 0 {
				t.Fatal("batch order or baseline receipt", i, count)
			}
		}

		return nil
	}))

	for _, query := range []struct {
		name, sql string
		args      []any
		budget    float64
	}{
		{"unread-count", `SELECT count(*) ` + unreadMessagesSQL, []any{id, "0", guest}, 100000},
		{"first-unread", `SELECT id ` + unreadMessagesSQL + ` ORDER BY sequence LIMIT 1`, []any{id, "0", guest}, 1},
		{"receipts-100", chatReceiptCountsSQL, []any{id, owner, ids}, 100},
	} {
		var raw []byte
		requireChatSQL(t, db.pool.QueryRow(t.Context(), "EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) "+query.sql, query.args...).Scan(&raw))
		var plans []struct {
			Plan          feedPlan
			ExecutionTime float64 `json:"Execution Time"`
		}
		requireChatSQL(t, json.Unmarshal(raw, &plans))
		if len(plans) != 1 {
			t.Fatal("plan missing")
		}

		var visit func(feedPlan)
		scans := 0
		feedRows := float64(0)
		visit = func(p feedPlan) {
			if p.RelationName == "feed_entries" {
				scans++
				feedRows += (p.ActualRows + p.RowsRemoved) * p.ActualLoops
				if !strings.Contains(p.NodeType, "Index") {
					t.Errorf("history JSON scan or excess work %s %+v", query.name, p)
				}
			}

			for _, child := range p.Plans {
				visit(child)
			}
		}
		visit(plans[0].Plan)
		if scans == 0 {
			t.Fatal("no feed index plan")
		}

		if feedRows > query.budget {
			t.Errorf("%s visited %.0f feed rows, budget %.0f", query.name, feedRows, query.budget)
		}

		t.Logf("history=100000 query=%s execution_ms=%.3f feed_row_budget=%.0f plan=%s", query.name, plans[0].ExecutionTime, query.budget, raw)
	}

	for _, name := range []string{"unread", "receipts"} {
		samples := []time.Duration{}
		for i := range 22 {
			start := time.Now()
			requireChatSQL(t, store.View(t.Context(), func(r meetings.Reader) error {
				if name == "unread" {
					_, err := r.ChatReadState(id, guest)
					return err
				}

				_, err := r.ChatReceiptCounts(id, owner, ids)

				return err
			}))
			if i >= 2 {
				samples = append(samples, time.Since(start))
			}
		}

		slices.Sort(samples)
		p95 := samples[18]
		t.Logf("history=100000 query=%s samples=20 p95_ms=%.3f budget_ms=100", name, float64(p95.Microseconds())/1000)
		if p95 > 100*time.Millisecond {
			t.Errorf("%s p95 %v exceeds 100ms integration budget", name, p95)
		}
	}
}
