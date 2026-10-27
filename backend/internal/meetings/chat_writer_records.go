package meetings

import "errors"

func (w *chatWriter) SaveMeeting(value Meeting) error {
	before, err := w.Writer.Meeting(value.ID)
	err = recordChatWrite(w, value.ID, before, err, value, func() error { return w.Writer.SaveMeeting(value) }, "meeting_changed", "meeting", value.ID)
	if err != nil {
		return err
	}

	if before.OrganizerID != "" && before.OrganizerID != value.OrganizerID {
		w.record(value.ID, "receipts_changed", "", "")
	}

	if w.readState && value.OrganizerID != "" {
		_, err = w.Writer.EnsureChatReadMarker(value.ID, value.OrganizerID, w.now)
	}

	return err
}

func (w *chatWriter) AppendEntry(value FeedEntry) (FeedEntry, error) {
	if err := w.capture(value.MeetingID); err != nil {
		return FeedEntry{}, err
	}

	entry, err := w.Writer.AppendEntry(value)
	if err != nil {
		return FeedEntry{}, err
	}

	w.record(value.MeetingID, "entry_upsert", "entry", entry.ID)

	return entry, nil
}

func (w *chatWriter) SaveRSVP(value RSVP) error {
	before, lookupErr := w.Writer.RSVP(value.MeetingID, value.UserID)
	err := recordChatWrite(w, value.MeetingID, before, lookupErr, value, func() error { return w.Writer.SaveRSVP(value) }, "meeting_changed", "meeting", value.MeetingID)
	if err == nil && (before.Answer == Going) != (value.Answer == Going) {
		w.record(value.MeetingID, "history_invalidated", "", "")
		w.record(value.MeetingID, "receipts_changed", "", "")
	}

	if err == nil && w.readState && value.Answer == Going {
		_, err = w.Writer.EnsureChatReadMarker(value.MeetingID, value.UserID, w.now)
	}

	return err
}

func (w *chatWriter) SaveDatePoll(value DatePoll) error {
	before, err := w.Writer.DatePoll(value.ID)
	after := value
	before.CloseJob, after.CloseJob = PollCloseJob{}, PollCloseJob{}

	return recordChatWrite(w, value.MeetingID, before, err, after, func() error { return w.Writer.SaveDatePoll(value) }, "entry_upsert", "date_poll", value.ID)
}

func (w *chatWriter) SavePlacePoll(value PlacePoll) error {
	before, err := w.Writer.PlacePoll(value.ID)
	after := value
	before.CloseJob, after.CloseJob = PollCloseJob{}, PollCloseJob{}

	return recordChatWrite(w, value.MeetingID, before, err, after, func() error { return w.Writer.SavePlacePoll(value) }, "entry_upsert", "place_poll", value.ID)
}

func (w *chatWriter) SavePreparationTask(value PreparationTask) error {
	before, err := w.Writer.PreparationTask(value.ID)
	return recordChatWrite(w, value.MeetingID, before, err, value, func() error { return w.Writer.SavePreparationTask(value) }, "entry_upsert", "preparation_task", value.ID)
}

func (w *chatWriter) SaveReaction(value Reaction, active bool) error {
	before, err := w.Writer.ReactionActive(value)
	if err != nil {
		return err
	}

	return recordChatWrite(w, value.MeetingID, before, nil, active, func() error { return w.Writer.SaveReaction(value, active) }, "entry_upsert", "entry", value.EntryID)
}

func (w *chatWriter) SaveMedia(value Media) error {
	before, err := w.Writer.Media(value.ID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return err
	}

	if before.Status != "published" && value.Status != "published" {
		return w.Writer.SaveMedia(value)
	}

	kind, resource, id := "meeting_changed", "meeting", value.MeetingID
	if value.EntryID != "" {
		kind, resource, id = "entry_upsert", "entry", value.EntryID
	}

	return recordChatWrite(w, value.MeetingID, before, err, value, func() error { return w.Writer.SaveMedia(value) }, kind, resource, id)
}

func (w *chatWriter) SaveCover(value Cover) error {
	before, err := w.Writer.Cover(value.MeetingID)
	return recordChatWrite(w, value.MeetingID, before, err, value, func() error { return w.Writer.SaveCover(value) }, "meeting_changed", "meeting", value.MeetingID)
}
