package meetings

import (
	"errors"
	"reflect"
	"slices"
	"strings"
	"time"
)

type chatMutation struct {
	readUsers  map[string]bool
	changes    map[string]ChatChange
	recipients map[string]bool
	deleted    bool
	stream     ChatStream
}

type chatWriter struct {
	readState bool
	Writer
	now       time.Time
	mutations map[string]*chatMutation
}

func newChatWriter(w Writer, now time.Time) *chatWriter {
	return &chatWriter{Writer: w, now: now.UTC(), mutations: map[string]*chatMutation{}}
}

func (w *chatWriter) capture(id string) error {
	if _, ok := w.mutations[id]; ok {
		return nil
	}

	mutation := &chatMutation{changes: map[string]ChatChange{}, recipients: map[string]bool{}}
	meeting, err := w.Writer.Meeting(id)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return err
	}

	if err == nil {
		if err := w.recipients(mutation, meeting); err != nil {
			return err
		}

		stream, err := w.Writer.ChatStream(id)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return err
		}

		mutation.stream = stream
	}

	w.mutations[id] = mutation

	return nil
}

func (w *chatWriter) recipients(m *chatMutation, meeting Meeting) error {
	if meeting.OrganizerID != "" {
		m.recipients[meeting.OrganizerID] = true
	}

	responses, err := w.Writer.RSVPs(meeting.ID)
	if err != nil {
		return err
	}

	for _, response := range responses {
		m.recipients[response.UserID] = true
	}

	return nil
}

func (w *chatWriter) record(id, kind, resourceKind, resourceID string) {
	change := ChatChange{MeetingID: id, Kind: kind, ResourceKind: resourceKind, ResourceID: resourceID, CreatedAt: w.now}
	if resourceKind == "entry" {
		change.EntryID = resourceID
	}

	w.mutations[id].changes[kind+":"+resourceKind+":"+resourceID] = change
}

func recordChatWrite[T any](w *chatWriter, id string, before T, lookupErr error, after T, save func() error, kind, resourceKind, resourceID string) error {
	if lookupErr != nil && !errors.Is(lookupErr, ErrNotFound) {
		return lookupErr
	}

	if lookupErr == nil && reflect.DeepEqual(before, after) {
		return save()
	}

	if err := w.capture(id); err != nil {
		return err
	}

	if err := save(); err != nil {
		return err
	}

	w.record(id, kind, resourceKind, resourceID)

	return nil
}

func (w *chatWriter) flush() error {
	ids := make([]string, 0, len(w.mutations))
	for id := range w.mutations {
		ids = append(ids, id)
	}

	slices.Sort(ids)
	for _, id := range ids {
		m := w.mutations[id]
		if !m.deleted {
			meeting, err := w.Writer.Meeting(id)
			if err != nil {
				return err
			}

			if err := w.recipients(m, meeting); err != nil {
				return err
			}

			if len(m.changes) == 0 {
				continue
			}

			changes := make([]ChatChange, 0, len(m.changes))
			for _, change := range m.changes {
				changes = append(changes, change)
			}

			slices.SortFunc(changes, func(a, b ChatChange) int {
				return strings.Compare(a.Kind+":"+a.ResourceKind+":"+a.ResourceID, b.Kind+":"+b.ResourceKind+":"+b.ResourceID)
			})
			stream, err := w.Writer.AppendChatChanges(id, randomUUID(), changes)
			if err != nil {
				return err
			}

			stream, err = w.Writer.TrimChatStream(id, time.Time{}, chatMaximumChanges)
			if err != nil {
				return err
			}

			m.stream = stream
			if err := w.hint(m, id, "meeting", id); err != nil {
				return err
			}
		}

		personal := m.recipients
		if len(m.changes) == 1 && len(m.readUsers) > 0 {
			if _, ok := m.changes["receipts_changed::"]; ok {
				personal = m.readUsers
			}
		}

		recipients := make([]string, 0, len(personal))
		for userID := range personal {
			recipients = append(recipients, userID)
		}

		slices.Sort(recipients)
		for _, userID := range recipients {
			removed, err := w.Writer.UserRemoved(userID)
			if err != nil {
				return err
			}

			if removed {
				continue
			}

			if err := w.hint(m, id, "user", userID); err != nil {
				return err
			}
		}
	}

	return nil
}

func (w *chatWriter) hint(m *chatMutation, meetingID, target, targetID string) error {
	return w.Writer.EnqueueChatHint(ChatHint{ID: randomUUID(), Target: target, TargetID: targetID, MeetingID: meetingID, Epoch: m.stream.Epoch, LatestSequence: m.stream.LatestSequence, SchemaVersion: 1, Terminal: m.deleted, CreatedAt: w.now, AvailableAt: w.now})
}
