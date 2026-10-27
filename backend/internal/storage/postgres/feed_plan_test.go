package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type feedPlan struct {
	NodeType      string     `json:"Node Type"`
	RelationName  string     `json:"Relation Name"`
	ActualRows    float64    `json:"Actual Rows"`
	ActualLoops   float64    `json:"Actual Loops"`
	RowsRemoved   float64    `json:"Rows Removed by Filter"`
	RowsRechecked float64    `json:"Rows Removed by Index Recheck"`
	Plans         []feedPlan `json:"Plans"`
}

// This is an opt-in fixture against somewhere_integration, never a local DB or
// production. It checks the actual production query plans at all three planned
// history sizes. Timings are observations, not a portable latency benchmark.
func TestFeedBoundedQueryPlansIntegration(t *testing.T) {
	db := integrationDB(t)
	for _, count := range []int{1000, 10000, 100000} {
		t.Run(strconv.Itoa(count), func(t *testing.T) {
			id := fmt.Sprintf("bounded-plan-%x", randBytes(12))
			t.Cleanup(func() {
				if err := db.Meetings().Update(context.Background(), func(w meetings.Writer) error { return w.DeleteMeeting(id) }); err != nil {
					t.Error("fixture cleanup", err)
				}
			})
			err := db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
				return w.SaveMeeting(meetings.Meeting{ID: id})
			})
			if err != nil {
				t.Fatal("create bounded plan fixture", err)
			}

			// Keep each statement and its deferred constraints within the normal
			// five-second timeout, including on the small integration VM.
			const batchSize = 1000
			for first := 1; first <= count; first += batchSize {
				last := min(first+batchSize-1, count)
				err := db.Meetings().Update(t.Context(), func(w meetings.Writer) error {
					_, err := w.(*transaction).exec(`INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document)
    SELECT $1||'-'||n,$1,n,'actor',n::text,jsonb_build_object('ID',$1||'-'||n,'MeetingID',$1,'Sequence',n,'ActorID','actor','ClientRequestID',n::text,'Kind','message','Payload',jsonb_build_object('text','fixture'))
    FROM generate_series($2::int,$3::int) AS n`, id, first, last)

					return err
				})
				if err != nil {
					t.Fatalf("seed bounded plan fixture rows %d..%d: %v", first, last, err)
				}
			}

			var seeded int
			if err := db.pool.QueryRow(t.Context(), "SELECT count(*) FROM feed_entries WHERE meeting_id=$1", id).Scan(&seeded); err != nil {
				t.Fatal("count seeded rows", err)
			}

			if seeded != count {
				t.Fatalf("seeded %d rows, want %d", seeded, count)
			}

			if _, err := db.pool.Exec(t.Context(), "ANALYZE feed_entries"); err != nil {
				t.Fatal("analyze isolated fixture", err)
			}

			cases := []struct {
				name, sql string
				args      []any
				budget    float64
			}{
				{"initial", feedInitialSQL, []any{id, 51}, 51},
				{"after", feedAfterSQL, []any{id, strconv.Itoa(count / 2), 51}, 51},
				{"before", feedBeforeSQL, []any{id, strconv.Itoa(count / 2), 51}, 51},
				{"empty-tail", feedAfterSQL, []any{id, strconv.Itoa(count), 51}, 51},
				{"tail", feedTailSQL, []any{id}, 1},
				{"entry", feedEntrySQL, []any{id, id + "-500"}, 1},
				{"intent", feedRequestSQL, []any{id, "actor", "500"}, 1},
			}
			for _, c := range cases {
				t.Run(c.name, func(t *testing.T) {
					var raw []byte
					if err := db.pool.QueryRow(t.Context(), "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) "+c.sql, c.args...).Scan(&raw); err != nil {
						t.Fatal("explain", err)
					}

					var plans []struct {
						Plan          feedPlan
						PlanningTime  float64 `json:"Planning Time"`
						ExecutionTime float64 `json:"Execution Time"`
					}
					if err := json.Unmarshal(raw, &plans); err != nil || len(plans) != 1 {
						t.Fatal("invalid query plan", err)
					}

					feedScans := 0
					var inspect func(feedPlan)
					inspect = func(node feedPlan) {
						if node.RelationName == "feed_entries" {
							feedScans++
							if !boundedFeedIndexScan(node, c.budget) {
								t.Errorf("unbounded feed scan: %+v", node)
							}
						}

						for _, child := range node.Plans {
							inspect(child)
						}
					}
					inspect(plans[0].Plan)
					if feedScans == 0 {
						t.Fatal("plan did not inspect feed index")
					}

					t.Logf("history=%d query=%s planning_ms=%.3f execution_ms=%.3f feed_scans=%d budget_rows=%.0f", count, c.name, plans[0].PlanningTime, plans[0].ExecutionTime, feedScans, c.budget)
				})
			}
		})
	}
}
