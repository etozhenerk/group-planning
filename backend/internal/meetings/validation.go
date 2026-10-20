package meetings

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"regexp"
	"strconv"
	"strings"
	"time"
	_ "time/tzdata" // Keep IANA validation available when the OS has no zoneinfo files.
	"unicode/utf8"
)

var (
	uuidPattern      = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)
	decimalPattern   = regexp.MustCompile(`^(0|[1-9][0-9]*)$`)
	timestampPattern = regexp.MustCompile(`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$`)
)

// ParseUUID accepts the wire UUID format and returns its canonical spelling.
func ParseUUID(value string) (string, error) {
	if !uuidPattern.MatchString(value) {
		return "", ErrInvalidRecord
	}

	return strings.ToLower(value), nil
}

// ParseRevision rejects numbers that cannot round-trip through the wire format.
func ParseRevision(value string) (uint64, error) {
	if !decimalPattern.MatchString(value) {
		return 0, ErrInvalidRecord
	}

	return strconv.ParseUint(value, 10, 64)
}

func randomUUID() string {
	var data [16]byte
	_, _ = rand.Read(data[:])
	data[6] = data[6]&0x0f | 0x40
	data[8] = data[8]&0x3f | 0x80
	text := hex.EncodeToString(data[:])

	return text[:8] + "-" + text[8:12] + "-" + text[12:16] + "-" + text[16:20] + "-" + text[20:]
}

func randomToken() string {
	var data [32]byte
	_, _ = rand.Read(data[:])

	return base64.RawURLEncoding.EncodeToString(data[:])
}

func requestHash(value any) string {
	data, _ := json.Marshal(value)
	hash := sha256.Sum256(data)

	return hex.EncodeToString(hash[:])
}

func validateText(field, value string, max int, required bool) error {
	if !utf8.ValidString(value) || utf8.RuneCountInString(value) > max || (required && strings.TrimSpace(value) == "") {
		return ValidationError{map[string]string{field: "invalid_length"}}
	}

	return nil
}

func loadZone(zone string) (*time.Location, error) {
	if zone == "" || zone == "Local" || len(zone) > 128 {
		return nil, ValidationError{map[string]string{"timezone": "invalid"}}
	}

	location, err := time.LoadLocation(zone)
	if err != nil {
		return nil, ValidationError{map[string]string{"timezone": "invalid"}}
	}

	return location, nil
}

func parseInstant(value string) (time.Time, error) {
	if !timestampPattern.MatchString(value) {
		return time.Time{}, ValidationError{map[string]string{"starts_at": "invalid"}}
	}

	instant, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		return time.Time{}, ValidationError{map[string]string{"starts_at": "invalid"}}
	}

	return instant, nil
}

func validateOffset(instant time.Time, location *time.Location) error {
	_, supplied := instant.Zone()
	_, expected := instant.In(location).Zone()
	if supplied != expected {
		return ValidationError{map[string]string{"starts_at": "timezone_mismatch"}}
	}

	return nil
}

func keyFor(actor Actor, operation, key string) (RequestKey, error) {
	value, err := ParseUUID(key)
	if err != nil {
		return RequestKey{}, ValidationError{map[string]string{"idempotency_key": "invalid"}}
	}

	return RequestKey{UserID: actor.ID, Operation: operation, Key: value}, nil
}
