package realtime

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// Unlike expect, retain every push before the command barrier to detect leaks.
func independentFramesThrough(t *testing.T, c *testSocket, id int) []string {
	t.Helper()
	if err := c.SetReadDeadline(time.Now().Add(4 * time.Second)); err != nil {
		t.Fatal(err)
	}
	var frames []string
	for range 20 {
		var header [2]byte
		if _, err := io.ReadFull(c.reader, header[:]); err != nil {
			t.Fatal(err, frames)
		}
		n := uint64(header[1] & 127)
		if n == 126 {
			var b [2]byte
			if _, err := io.ReadFull(c.reader, b[:]); err != nil {
				t.Fatal(err)
			}
			n = uint64(binary.BigEndian.Uint16(b[:]))
		}
		if n == 127 {
			var b [8]byte
			if _, err := io.ReadFull(c.reader, b[:]); err != nil {
				t.Fatal(err)
			}
			n = binary.BigEndian.Uint64(b[:])
		}
		if n > 1<<20 {
			t.Fatal("oversized frame")
		}
		data := make([]byte, int(n))
		if _, err := io.ReadFull(c.reader, data); err != nil {
			t.Fatal(err)
		}
		if header[0]&15 == 8 {
			t.Fatalf("unexpected close %q", data)
		}
		frames = append(frames, string(data))
		for _, line := range strings.Split(string(data), "\n") {
			var reply struct {
				ID int `json:"id"`
			}
			if json.Unmarshal([]byte(line), &reply) == nil && reply.ID == id {
				return frames
			}
		}
	}
	t.Fatal("command barrier missing", frames)
	return nil
}

func TestIndependentRealtimeRevokeBeforePublication(t *testing.T) {
	f := newSocketFixture(t)
	c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
	c.command(t, `{"id":1,"connect":{}}`)
	c.expect(t, `"personal:u"`)
	c.command(t, `{"id":2,"subscribe":{"channel":"meeting:m"}}`)
	if reply := c.expect(t, `"id":2`); strings.Contains(reply, `"error"`) {
		t.Fatal(reply)
	}
	// Access disappears while the connection stays alive. No client refresh occurs.
	if err := f.store.Update(t.Context(), func(w meetings.Writer) error { return w.SaveMeeting(meetings.Meeting{ID: "m", OrganizerID: "other"}) }); err != nil {
		t.Fatal(err)
	}
	if err := f.adapter.PublishChat(t.Context(), meetings.ChatHint{ID: "secret-event", Target: "meeting", TargetID: "m", MeetingID: "m", Epoch: "epoch", LatestSequence: 42, SchemaVersion: 1}); err != nil {
		t.Fatal(err)
	}
	c.command(t, `{"id":3,"subscribe":{"channel":"personal:other"}}`)
	frames := independentFramesThrough(t, c, 3)
	observed := strings.Join(frames, "\n")
	if !strings.Contains(observed, `"code":2003`) || strings.Contains(observed, `"pub"`) || strings.Contains(observed, `"latest_change_sequence"`) {
		t.Fatalf("revocation leaked or omitted unsubscribe: %s", observed)
	}
	c.command(t, `{"id":4,"subscribe":{"channel":"meeting:m","recover":true,"offset":0,"epoch":"epoch"}}`)
	denied := c.expect(t, `"id":4`)
	if !strings.Contains(denied, `"code":103`) || strings.Contains(denied, `"publications"`) || strings.Contains(denied, `"epoch"`) {
		t.Fatal("denied recovery leaked metadata", denied)
	}
	// Mandatory personal remains usable after membership revocation.
	if err := f.adapter.PublishChat(t.Context(), meetings.ChatHint{ID: "terminal", Target: "user", TargetID: "u", MeetingID: "m", Terminal: true, SchemaVersion: 1}); err != nil {
		t.Fatal(err)
	}
	c.expect(t, `"access_revoked":true`)
	t.Logf("revoked publication barrier=%s denied recovery=%s; personal terminal delivered", observed, denied)
}

func TestIndependentRealtimeAmbiguousHeadersAndIdentitySpoofing(t *testing.T) {
	f := newSocketFixture(t)
	for _, tc := range []struct {
		name, path string
		headers    map[string][]string
		status     int
	}{
		{"duplicate origin", "", map[string][]string{"Authorization": {"Bearer " + f.native}, "Origin": {"https://somewhere.test", "https://somewhere.test"}}, 403},
		{"duplicate bearer", "", map[string][]string{"Authorization": {"Bearer " + f.native, "Bearer " + f.native}}, 401},
		{"foreign native origin", "", map[string][]string{"Authorization": {"Bearer " + f.native}, "Origin": {"https://attacker.test"}}, 403},
		{"empty query", "?", map[string][]string{"Authorization": {"Bearer " + f.native}}, 400},
	} {
		t.Run(tc.name, func(t *testing.T) {
			req, _ := http.NewRequest(http.MethodGet, f.server.URL+"/api/v1/realtime"+tc.path, nil)
			req.Header = http.Header(tc.headers)
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			if resp.StatusCode != tc.status || strings.Contains(string(body), f.native) {
				t.Fatalf("status=%d body=%s", resp.StatusCode, body)
			}
			t.Logf("HTTP status=%d", resp.StatusCode)
		})
	}
	for i, connect := range []string{`{"token":"forged"}`, `{"headers":{"Authorization":"Bearer forged"}}`, `{"data":{"user_id":"other"}}`} {
		t.Run(fmt.Sprint("spoof-", i), func(t *testing.T) {
			c := openSocket(t, f.server.URL, "Authorization: Bearer "+f.native+"\r\n")
			c.command(t, `{"id":1,"connect":`+connect+`}`)
			reply := c.expect(t, `"code":101`)
			if strings.Contains(reply, `"personal:"`) {
				t.Fatal(reply)
			}
			c.Close()
			t.Log("connect rejected with 101")
		})
	}
}
