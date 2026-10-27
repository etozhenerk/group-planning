package postgres

import "testing"

func boundedFeedIndexScan(node feedPlan, budget float64) bool {
	if node.ActualRows*node.ActualLoops > budget || node.RowsRemoved > 0 || node.RowsRechecked > 0 {
		return false
	}

	switch node.NodeType {
	case "Index Scan", "Index Only Scan":
		return true
	case "Bitmap Heap Scan":
		// A bitmap index may visit more rows than its heap scan returns, so
		// both stages must satisfy the same bound, including repeated loops.
		if len(node.Plans) != 1 {
			return false
		}

		index := node.Plans[0]

		return index.NodeType == "Bitmap Index Scan" && len(index.Plans) == 0 &&
			index.ActualRows*index.ActualLoops <= budget && index.RowsRemoved == 0 && index.RowsRechecked == 0
	default:
		return false
	}
}

func TestBoundedFeedIndexScan(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*feedPlan)
		want   bool
	}{
		{"observed-bitmap-lookup", func(*feedPlan) {}, true},
		{"index-scan", func(p *feedPlan) {
			p.NodeType = "Index Scan"
			p.Plans = nil
		}, true},
		{"index-only-scan", func(p *feedPlan) {
			p.NodeType = "Index Only Scan"
			p.Plans = nil
		}, true},
		{"seq-scan", func(p *feedPlan) {
			p.NodeType = "Seq Scan"
			p.Plans = nil
		}, false},
		{"heap-extra-rows", func(p *feedPlan) { p.ActualRows = 2 }, false},
		{"heap-repeated-loops", func(p *feedPlan) { p.ActualLoops = 2 }, false},
		{"heap-filtered-rows", func(p *feedPlan) { p.RowsRemoved = 1 }, false},
		{"heap-index-recheck", func(p *feedPlan) { p.RowsRechecked = 1 }, false},
		{"bitmap-extra-rows", func(p *feedPlan) { p.Plans[0].ActualRows = 1000 }, false},
		{"bitmap-repeated-loops", func(p *feedPlan) { p.Plans[0].ActualLoops = 2 }, false},
		{"bitmap-missing-index", func(p *feedPlan) { p.Plans = nil }, false},
		{"bitmap-seq-child", func(p *feedPlan) { p.Plans[0].NodeType = "Seq Scan" }, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			// QA-PLAN-SHAPE-001: the 1k entry and intent lookups used this
			// exact shape, with one row, one loop and no discarded rows.
			plan := feedPlan{
				NodeType:     "Bitmap Heap Scan",
				RelationName: "feed_entries",
				ActualRows:   1,
				ActualLoops:  1,
				Plans: []feedPlan{{
					NodeType:    "Bitmap Index Scan",
					ActualRows:  1,
					ActualLoops: 1,
				}},
			}
			c.mutate(&plan)

			if got := boundedFeedIndexScan(plan, 1); got != c.want {
				t.Fatalf("boundedFeedIndexScan(%+v, 1) = %t, want %t", plan, got, c.want)
			}
		})
	}
}
