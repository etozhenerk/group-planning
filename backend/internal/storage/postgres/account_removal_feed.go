package postgres

import "strconv"

// Keep the per-entry foreign-key cascades within the normal statement timeout.
// Every batch stays in the caller's transaction and under the same write lock:
// cancellation or any failure rolls the entire meeting deletion back.
func (tx *transaction) deleteMeetingFeed(id string) error {
	var after uint64
	for {
		position := strconv.FormatUint(after, 10)
		through, err := one[uint64](tx, `SELECT to_jsonb(coalesce(max(sequence),0)) FROM (
		 SELECT sequence FROM feed_entries WHERE meeting_id=$1 AND sequence>$2::text::numeric
		 ORDER BY sequence LIMIT 1000) AS batch`, id, position)
		if err != nil {
			return err
		}

		if through == 0 {
			return nil
		}

		if _, err := tx.exec(`DELETE FROM feed_entries
		 WHERE meeting_id=$1 AND sequence>$2::text::numeric AND sequence<=$3::text::numeric`,
			id, position, strconv.FormatUint(through, 10)); err != nil {
			return err
		}

		after = through
	}
}
