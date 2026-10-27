package realtime

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/centrifugal/protocol"
	"github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestRealtimeMandatoryPersonalAndMeetingSwitch(t *testing.T) {
	for _, protobuf := range []bool{false, true} {
		t.Run(fmt.Sprint("protobuf=", protobuf), func(t *testing.T) {
			f := newSocketFixture(t)
			if err := f.store.Update(t.Context(), func(w meetings.Writer) error {
				return w.SaveMeeting(meetings.Meeting{ID: "second", OrganizerID: "u"})
			}); err != nil {
				t.Fatal(err)
			}

			headers := "Authorization: Bearer " + f.native + "\r\n"
			if protobuf {
				headers += "Sec-WebSocket-Protocol: centrifuge-protobuf\r\n"
			}

			c := openSocket(t, f.server.URL, headers)
			command := func(cmd *protocol.Command, errorCode uint32) {
				t.Helper()
				var data []byte
				var err error
				if protobuf {
					data, err = protocol.NewProtobufCommandEncoder().Encode(cmd)
				} else {
					data, err = json.Marshal(cmd)
				}

				if err != nil {
					t.Fatal(err)
				}

				var reply *protocol.Reply
				if protobuf {
					c.frame(t, 2, data)
					frame := c.expect(t, string([]byte{8, byte(cmd.Id)}))
					reply, err = protocol.NewProtobufReplyDecoder([]byte(frame)).Decode()
				} else {
					c.frame(t, 1, data)
					frame := c.expect(t, fmt.Sprintf(`"id":%d`, cmd.Id))
					reply, err = protocol.NewJSONReplyDecoder([]byte(frame)).Decode()
				}

				if err != nil {
					t.Fatal(err)
				}

				if reply.Id != cmd.Id || reply.Error.GetCode() != errorCode {
					t.Fatalf("command %d expected error %d: %+v", cmd.Id, errorCode, reply)
				}
			}
			command(&protocol.Command{Id: 1, Connect: &protocol.ConnectRequest{}}, 0)
			command(&protocol.Command{Id: 2, Unsubscribe: &protocol.UnsubscribeRequest{Channel: "personal:u"}}, 103)
			command(&protocol.Command{Id: 3, Subscribe: &protocol.SubscribeRequest{Channel: "meeting:m"}}, 0)
			command(&protocol.Command{Id: 4, Subscribe: &protocol.SubscribeRequest{Channel: "meeting:second"}}, 106)
			command(&protocol.Command{Id: 5, Unsubscribe: &protocol.UnsubscribeRequest{Channel: "meeting:m"}}, 0)
			command(&protocol.Command{Id: 6, Subscribe: &protocol.SubscribeRequest{Channel: "meeting:second"}}, 0)
			command(&protocol.Command{Id: 7, Unsubscribe: &protocol.UnsubscribeRequest{Channel: "personal:u"}}, 103)
			if err := f.adapter.PublishChat(t.Context(), meetings.ChatHint{SchemaVersion: 1, Target: "user", TargetID: "u", MeetingID: "m", Epoch: "epoch", LatestSequence: 7}); err != nil {
				t.Fatal(err)
			}

			c.expect(t, `"invalidation":true`)
		})
	}
}
