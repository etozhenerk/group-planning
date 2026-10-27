package meetings

import "errors"

func (w *chatWriter) DeleteMeeting(id string) error {
	if err := w.capture(id); err != nil {
		return err
	}

	if err := w.Writer.DeleteMeeting(id); err != nil {
		return err
	}

	w.mutations[id].deleted = true

	return nil
}

func (w *chatWriter) DeleteRSVP(id, userID string) error {
	_, err := w.Writer.RSVP(id, userID)
	if errors.Is(err, ErrNotFound) {
		return w.Writer.DeleteRSVP(id, userID)
	}

	if err != nil {
		return err
	}

	if err := w.capture(id); err != nil {
		return err
	}

	if err := w.Writer.DeleteRSVP(id, userID); err != nil {
		return err
	}

	w.record(id, "meeting_changed", "meeting", id)
	w.record(id, "history_invalidated", "", "")
	w.record(id, "receipts_changed", "", "")

	return nil
}

func (w *chatWriter) AnonymizeFeed(id, userID, name string) error {
	changed, err := w.Writer.FeedNeedsAnonymization(id, userID, name)
	if err != nil {
		return err
	}

	if !changed {
		return w.Writer.AnonymizeFeed(id, userID, name)
	}

	if err := w.capture(id); err != nil {
		return err
	}

	if err := w.Writer.AnonymizeFeed(id, userID, name); err != nil {
		return err
	}

	w.record(id, "history_invalidated", "", "")

	return nil
}

func (w *chatWriter) DeleteCover(id string) error {
	_, err := w.Writer.Cover(id)
	if errors.Is(err, ErrNotFound) {
		return w.Writer.DeleteCover(id)
	}

	if err != nil {
		return err
	}

	if err := w.capture(id); err != nil {
		return err
	}

	if err := w.Writer.DeleteCover(id); err != nil {
		return err
	}

	w.record(id, "meeting_changed", "meeting", id)

	return nil
}

func (w *chatWriter) DeleteMedia(id string) error {
	before, err := w.Writer.Media(id)
	if errors.Is(err, ErrNotFound) {
		return w.Writer.DeleteMedia(id)
	}

	if err != nil {
		return err
	}

	if before.Status != "published" {
		return w.Writer.DeleteMedia(id)
	}

	if err := w.capture(before.MeetingID); err != nil {
		return err
	}

	if err := w.Writer.DeleteMedia(id); err != nil {
		return err
	}

	w.record(before.MeetingID, "history_invalidated", "", "")

	return nil
}
