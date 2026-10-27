package realtime

import (
	"encoding/json"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentPersonalUnsubscribeCannotExpandMeetingLimit(t *testing.T) {
	f := newSocketFixture(t)
	if err := f.store.Update(t.Context(), func(w meetings.Writer) error {
		return w.SaveMeeting(meetings.Meeting{ID: "second", OrganizerID: "u"})
	}); err != nil {
		t.Fatal(err)
	}

	c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
	c.command(t, `{"id":1,"connect":{}}`)
	c.expect(t, `"personal:u"`)
	c.command(t, `{"id":2,"unsubscribe":{"channel":"personal:u"}}`)
	unsub := c.expect(t, `"id":2`)
	c.command(t, `{"id":3,"subscribe":{"channel":"meeting:m"}}`)
	first := c.expect(t, `"id":3`)
	c.command(t, `{"id":4,"subscribe":{"channel":"meeting:second"}}`)
	second := c.expect(t, `"id":4`)
	var reply struct {
		Error *struct {
			Code int `json:"code"`
		} `json:"error"`
	}
	if err := json.Unmarshal([]byte(second), &reply); err != nil {
		t.Fatal(err)
	}

	t.Logf("unsubscribe=%s first=%s second=%s", unsub, first, second)
	if reply.Error == nil {
		t.Fatal("two meeting subscriptions accepted after removing mandatory personal channel")
	}
}
