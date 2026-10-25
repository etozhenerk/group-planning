package yandex

import (
	"context"
	"net/http"
	"strings"
	"testing"
)

func TestPersonalProfileFields(t *testing.T) {
	for _, tc := range []struct {
		name, fields string
		want         *string
	}{
		{"complete", `"first_name":" Александр ","last_name":"Иванов","birthday":"1990-12-23","sex":"male"`, new("1990-12-23")},
		{"partial", `"birthday":"0000-02-29"`, new("0000-02-29")},
		{"year-only", `"birthday":"1990-00-00"`, new("1990-00-00")},
		{"month-only", `"birthday":"0000-12-00"`, new("0000-12-00")},
		{"day-only", `"birthday":"0000-00-23"`, new("0000-00-23")},
		{"null", `"birthday":null,"sex":null,"first_name":null,"last_name":null`, new("")},
		{"empty", `"birthday":""`, new("")},
		{"zero", `"birthday":"0000-00-00"`, new("")},
		{"no-permission", `"ignored":true`, nil},
		{"invalid-date", `"birthday":"1990-02-29"`, nil},
		{"invalid-partial", `"birthday":"0000-02-30"`, nil},
		{"invalid-month", `"birthday":"0000-13-00"`, nil},
		{"invalid-type", `"birthday":23,"first_name":{},"sex":false`, nil},
		{"invalid-sign", `"birthday":"-001-01-01"`, nil},
	} {
		t.Run(tc.name, func(t *testing.T) {
			body := `{"id":"123","client_id":"client","display_name":"Саша","login":"sasha",` + tc.fields + `}`
			p := New("client", "secret", "https://somewhere.example/callback", transportFunc(func(*http.Request) (*http.Response, error) { return response(200, body), nil }))
			profile, err := p.VerifyToken(context.Background(), "token")
			if err != nil {
				t.Fatal(err)
			}

			if profile.Login == nil || *profile.Login != "sasha" {
				t.Fatal("missing private login")
			}

			if (profile.Birthday == nil) != (tc.want == nil) || tc.want != nil && *profile.Birthday != *tc.want {
				t.Fatal("incorrect birthday")
			}

			if tc.name == "complete" && (profile.FirstName == nil || *profile.FirstName != "Александр" || profile.LastName == nil || *profile.LastName != "Иванов" || profile.Sex == nil || *profile.Sex != "male") {
				t.Fatal("incorrect personal fields")
			}

			if tc.name == "null" && (profile.Sex == nil || *profile.Sex != "" || profile.FirstName == nil || *profile.FirstName != "" || profile.LastName == nil || *profile.LastName != "") {
				t.Fatal("null must clear known values")
			}
		})
	}
}

func TestInvalidPersonalFieldsDoNotReplaceKnownValues(t *testing.T) {
	body := `{"id":"123","client_id":"client","login":"sasha","sex":"guess","first_name":"` + strings.Repeat("x", 1001) + `","last_name":"bad\nname"}`
	p := New("client", "secret", "https://somewhere.example/callback", transportFunc(func(*http.Request) (*http.Response, error) { return response(200, body), nil }))
	profile, err := p.VerifyToken(context.Background(), "token")
	if err != nil || profile.FirstName != nil || profile.LastName != nil || profile.Sex != nil {
		t.Fatal("malformed optional fields must be ignored")
	}
}

func TestExplicitEmptyContactsClearKnownValues(t *testing.T) {
	for _, fields := range []string{
		`"default_email":null,"default_phone":null`,
		`"default_email":" ","default_phone":{"number":" "}`,
	} {
		body := `{"id":"123","client_id":"client","login":"sasha",` + fields + `}`
		p := New("client", "secret", "https://somewhere.example/callback", transportFunc(func(*http.Request) (*http.Response, error) { return response(200, body), nil }))
		profile, err := p.VerifyToken(context.Background(), "token")
		if err != nil || profile.Email == nil || *profile.Email != "" || profile.Phone == nil || *profile.Phone != "" {
			t.Fatal("explicit empty contacts were ignored")
		}
	}
}
