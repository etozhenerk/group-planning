package postgres

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatJournalBoundedQueryPlanIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		if err := w.SaveMeeting(meetings.Meeting{ID: id}); err != nil {
			return err
		}

		_, err := w.AppendChatChanges(id, "epoch", []meetings.ChatChange{{MeetingID: id, Kind: "history_invalidated", CreatedAt: now}})

		return err
	}))
	const count = 100000
	for first := 2; first <= count; first += 1000 {
		last := min(first+999, count)
		requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
			_, err := w.(*transaction).exec(`INSERT INTO meeting_changes(meeting_id,change_sequence,kind,entry_id,resource_kind,resource_id,created_at) SELECT $1,n,'history_invalidated','','','',$4 FROM generate_series($2::int,$3::int) n`, id, first, last, now)
			return err
		}))
	}

	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.(*transaction).exec("UPDATE meeting_streams SET latest_change_sequence=$2 WHERE meeting_id=$1", id, count)
		return err
	}))
	var seeded int
	requireChatSQL(t, db.pool.QueryRow(t.Context(), "SELECT count(*) FROM meeting_changes WHERE meeting_id=$1", id).Scan(&seeded))
	if seeded != count {
		t.Fatal("incomplete journal seed", seeded)
	}

	_, err := db.pool.Exec(t.Context(), "ANALYZE meeting_changes")
	requireChatSQL(t, err)
	for _, after := range []string{"0", "50000", "100000"} {
		var raw []byte
		requireChatSQL(t, db.pool.QueryRow(t.Context(), "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) "+chatChangesSQL, id, after, "100000", 101).Scan(&raw))
		var plans []struct {
			Plan          feedPlan
			ExecutionTime float64 `json:"Execution Time"`
		}
		requireChatSQL(t, json.Unmarshal(raw, &plans))
		if len(plans) != 1 {
			t.Fatal("missing plan")
		}

		scans := 0
		var inspect func(feedPlan)
		inspect = func(node feedPlan) {
			if node.RelationName == "meeting_changes" {
				scans++
				if !strings.Contains(node.NodeType, "Index") || node.ActualRows*node.ActualLoops > 101 || node.RowsRemoved > 0 {
					t.Errorf("unbounded journal scan: %+v", node)
				}
			}

			for _, child := range node.Plans {
				inspect(child)
			}
		}
		inspect(plans[0].Plan)
		if scans == 0 {
			t.Fatal("journal index not inspected")
		}

		t.Logf("history=%d after=%s execution_ms=%.3f scans=%d budget_rows=101", count, after, plans[0].ExecutionTime, scans)
	}
}
