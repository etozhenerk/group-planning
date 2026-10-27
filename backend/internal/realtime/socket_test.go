package realtime

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"
)

// Minimal test client exercises real HTTP upgrade and masked RFC6455 frames;
// application production code only uses the pinned Centrifuge transport.
type testSocket struct {
	net.Conn
	reader *bufio.Reader
}

func openSocket(t *testing.T, endpoint, headers string) *testSocket {
	t.Helper()
	u, err := url.Parse(endpoint)
	if err != nil {
		t.Fatal(err)
	}

	conn, err := net.DialTimeout("tcp", u.Host, time.Second)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { conn.Close() })
	_, err = fmt.Fprintf(conn, "GET /api/v1/realtime HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n%s\r\n", u.Host, headers)
	if err != nil {
		t.Fatal(err)
	}

	reader := bufio.NewReader(conn)
	response, err := http.ReadResponse(reader, nil)
	if err != nil {
		t.Fatal(err)
	}

	if response.StatusCode != 101 {
		body, _ := io.ReadAll(response.Body)
		t.Fatalf("upgrade %d %s", response.StatusCode, body)
	}

	return &testSocket{conn, reader}
}

func (s *testSocket) command(t *testing.T, value string) {
	t.Helper()
	s.frame(t, 1, []byte(value))
}

func (s *testSocket) frame(t *testing.T, opcode byte, data []byte) {
	t.Helper()
	header := []byte{0x80 | opcode}
	if len(data) < 126 {
		header = append(header, 0x80|byte(len(data)))
	} else {
		header = append(header, 0x80|126, byte(len(data)>>8), byte(len(data)))
	}

	mask := []byte{1, 2, 3, 4}
	header = append(header, mask...)
	for i := range data {
		data[i] ^= mask[i%4]
	}

	if _, err := s.Write(append(header, data...)); err != nil {
		t.Fatal(err)
	}
}

func (s *testSocket) expect(t *testing.T, needle string) string {
	t.Helper()
	if err := s.SetReadDeadline(time.Now().Add(4 * time.Second)); err != nil {
		t.Fatal(err)
	}

	for range 20 {
		var head [2]byte
		if _, err := io.ReadFull(s.reader, head[:]); err != nil {
			t.Fatalf("waiting %s: %v", needle, err)
		}

		n := uint64(head[1] & 127)
		if n == 126 {
			var b [2]byte
			if _, err := io.ReadFull(s.reader, b[:]); err != nil {
				t.Fatal(err)
			}

			n = uint64(binary.BigEndian.Uint16(b[:]))
		} else if n == 127 {
			var b [8]byte
			if _, err := io.ReadFull(s.reader, b[:]); err != nil {
				t.Fatal(err)
			}

			n = binary.BigEndian.Uint64(b[:])
		}

		if n > 1<<20 {
			t.Fatal("oversized test frame")
		}

		data := make([]byte, int(n))
		if _, err := io.ReadFull(s.reader, data); err != nil {
			t.Fatal(err)
		}

		if strings.Contains(string(data), needle) {
			return string(data)
		}

		if head[0]&15 == 8 && len(data) >= 2 && fmt.Sprint(binary.BigEndian.Uint16(data[:2])) == needle {
			return needle
		}

		if head[0]&15 == 8 {
			t.Fatalf("closed before %s: %q", needle, data)
		}
	}

	t.Fatalf("no matching frame %s", needle)

	return ""
}
