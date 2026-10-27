package postgres

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestChatDispatchPendingIndexIntegration(t *testing.T) {
	db, id, now := chatSQLFixture(t)
	for start := 0; start < 5000; start += 1000 {
		requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
			_, err := w.(*transaction).exec(`INSERT INTO realtime_outbox(id,target,target_id,meeting_id,epoch,latest_change_sequence,schema_version,terminal,created_at,available_at) SELECT $1||'-'||n,'user','recipient',$1,'epoch',0,1,false,$4,$4 FROM generate_series($2::int,$3::int) n`, id, start, start+999, now)
			return err
		}))
	}

	requireChatSQL(t, db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
		_, err := w.LeaseChatHints(now, now.Add(time.Minute), "active", 100)
		return err
	}))
	_, err := db.pool.Exec(t.Context(), "ANALYZE realtime_outbox")
	requireChatSQL(t, err)
	var raw []byte
	requireChatSQL(t, db.pool.QueryRow(t.Context(), `EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id FROM realtime_outbox WHERE dispatched_at IS NULL AND available_at<=$1 AND (lease_until IS NULL OR lease_until<=$1) ORDER BY available_at,created_at,id LIMIT 100`, now).Scan(&raw))
	var plans []struct{ Plan feedPlan }
	requireChatSQL(t, json.Unmarshal(raw, &plans))
	if len(plans) != 1 {
		t.Fatal("missing plan")
	}

	scans := 0
	var inspect func(feedPlan)
	inspect = func(p feedPlan) {
		if p.RelationName == "realtime_outbox" {
			scans++
			if !strings.Contains(p.NodeType, "Index") || p.ActualRows*p.ActualLoops > 100 || p.RowsRemoved > 0 {
				t.Errorf("unbounded claim: %+v", p)
			}
		}

		for _, child := range p.Plans {
			inspect(child)
		}
	}
	inspect(plans[0].Plan)
	if scans != 1 {
		t.Fatal("outbox index not inspected", scans)
	}

	t.Log("outbox=5000 active_leases=100 bounded_ready_rows=100")
}
