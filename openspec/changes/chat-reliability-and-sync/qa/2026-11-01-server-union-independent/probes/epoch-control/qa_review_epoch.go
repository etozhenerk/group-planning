// This file exists ONLY in an external QA go -overlay map. It is never a repository source input.
package memory

import (
	"context"
	"fmt"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// QAOnlyRotateChatEpoch changes one existing synthetic stream in a real memory transaction.
// All feed/journal/outbox/marker state and counters are deliberately left intact.
func (s *Store) QAOnlyRotateChatEpoch(ctx context.Context, id, expected, next string) (meetings.ChatStream, error) {
	var after meetings.ChatStream
	if id == "" || expected == "" || next == "" || expected == next || len(next) > 128 {
		return after, fmt.Errorf("invalid QA epoch guard")
	}
	err := s.Update(ctx, func(w meetings.Writer) error {
		tx := w.(*transaction)
		tx.mu.Lock()
		defer tx.mu.Unlock()
		if err := tx.check(true); err != nil {
			return err
		}
		stream, ok := tx.data.streams[id]
		if !ok || stream.Epoch != expected {
			return fmt.Errorf("QA stream guard mismatch")
		}
		stream.Epoch = next
		tx.data.streams[id] = stream
		after = stream
		return nil
	})
	return after, err
}
