package yandex

import (
	"encoding/json"
	"strconv"
	"strings"
	"time"
	"unicode"
)

// profileText distinguishes omitted permissions from an explicitly empty field.
// Malformed optional data is ignored without preventing authentication.
type profileText struct {
	value   string
	present bool
}

func (p *profileText) UnmarshalJSON(data []byte) error {
	*p = profileText{}
	var value *string
	if err := json.Unmarshal(data, &value); err != nil {
		return nil
	}

	p.present = true
	if value != nil {
		p.value = strings.TrimSpace(*value)
	}

	return nil
}

func (p profileText) pointer(valid func(string) bool) *string {
	if !p.present || !valid(p.value) {
		return nil
	}

	return &p.value
}

func validProfileName(value string) bool {
	return len(value) <= 1000 && strings.IndexFunc(value, unicode.IsControl) < 0
}

func validBirthday(value string) bool {
	if value == "" {
		return true
	}

	if len(value) != 10 || value[4] != '-' || value[7] != '-' {
		return false
	}

	for i, ch := range value {
		if i != 4 && i != 7 && (ch < '0' || ch > '9') {
			return false
		}
	}

	year, _ := strconv.Atoi(value[:4])
	month, _ := strconv.Atoi(value[5:7])
	day, _ := strconv.Atoi(value[8:])
	if month > 12 || day > 31 {
		return false
	}

	if month == 0 || day == 0 {
		return true
	}

	if year == 0 {
		year = 2000 // Unknown year may include February 29; never persist this substitute.
	}

	date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)

	return int(date.Month()) == month && date.Day() == day
}
