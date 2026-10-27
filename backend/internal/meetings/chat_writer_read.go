package meetings

import "time"

func (w *chatWriter) AdvanceChatReadMarker(id, userID string, sequence uint64, now time.Time) (ReadMarker, bool, error) {
	before, err := w.Writer.ChatReadMarker(id, userID)
	if err != nil {
		return ReadMarker{}, false, err
	}

	if sequence <= before.ReadThrough {
		return w.Writer.AdvanceChatReadMarker(id, userID, sequence, now)
	}

	if err := w.capture(id); err != nil {
		return ReadMarker{}, false, err
	}

	marker, changed, err := w.Writer.AdvanceChatReadMarker(id, userID, sequence, now)
	if err == nil && changed {
		w.record(id, "receipts_changed", "", "")
		if w.mutations[id].readUsers == nil {
			w.mutations[id].readUsers = map[string]bool{}
		}

		w.mutations[id].readUsers[userID] = true
	}

	return marker, changed, err
}
