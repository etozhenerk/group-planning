package realtime

import (
	"context"
	"encoding/json"
	"errors"
	"slices"
	"strconv"
	"time"

	"github.com/centrifugal/centrifuge"
	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

type hintDTO struct {
	SchemaVersion        uint32 `json:"schema_version"`
	MeetingID            string `json:"meeting_id"`
	StreamEpoch          string `json:"stream_epoch"`
	LatestChangeSequence string `json:"latest_change_sequence"`
	Invalidation         bool   `json:"invalidation,omitempty"`
	AccessRevoked        bool   `json:"access_revoked,omitempty"`
}

// PublishChat checks current authorization before sending reference-only hints.
func (a *Adapter) PublishChat(ctx context.Context, h meetings.ChatHint) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	a.mu.Lock()
	selected := map[*centrifuge.Client]credentials{}
	for c, credential := range a.clients {
		if (h.Target == "meeting" && slices.Contains(c.Channels(), "meeting:"+h.MeetingID)) || (h.Target == "user" && c.UserID() == h.TargetID) {
			selected[c] = credential
		}
	}

	a.mu.Unlock()
	for c, credential := range selected {
		_, err := a.auth.Authenticate(ctx, credential.token, credential.web)
		if errors.Is(err, identity.ErrUnauthenticated) {
			c.Disconnect(centrifuge.DisconnectForceNoReconnect)
			continue
		}

		if err != nil {
			return err
		}

		if err := a.checkAccess(ctx, c); err != nil {
			return err
		}
	}

	data := hintDTO{SchemaVersion: h.SchemaVersion, MeetingID: h.MeetingID, StreamEpoch: h.Epoch, LatestChangeSequence: strconv.FormatUint(h.LatestSequence, 10)}
	channel := "meeting:" + h.MeetingID
	if h.Target == "user" {
		channel = "personal:" + h.TargetID
		data.Invalidation = true
		data.AccessRevoked = h.Terminal
	}

	payload, err := json.Marshal(data)
	if err != nil {
		return err
	}

	if h.Target == "meeting" {
		_, err = a.node.Publish(channel, payload, centrifuge.WithHistory(1000, 120*time.Second))
	} else {
		_, err = a.node.Publish(channel, payload)
	}

	return err
}
