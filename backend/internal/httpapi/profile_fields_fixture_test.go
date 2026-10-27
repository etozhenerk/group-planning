package httpapi

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/identity/yandex"
)

const profileFieldsSubject = "fixture-profile-fields"

// These provider documents preserve omitted fields versus explicit JSON null.
// The real Yandex decoder runs against this closed transport, never the network.
func profileFieldsDocument(scenario string) (string, bool) {
	base := `"id":"fixture-profile-fields","client_id":"fixture-profile-client","display_name":"Александр Тестов"`
	switch scenario {
	case "profile-fields-full":
		return `{` + base + `,"login":"profile_fixture","first_name":"Александр","last_name":"Тестов","birthday":"1990-12-23","sex":"male","default_email":"profile@example.test","default_phone":{"number":"+79990000000"},"default_avatar_id":"fixture/portrait","is_avatar_empty":false}`, true
	case "profile-fields-partial":
		return `{` + base + `,"birthday":"0000-12-23","sex":null}`, true
	case "profile-fields-clear":
		return `{` + base + `,"birthday":null,"default_phone":null,"is_avatar_empty":true}`, true
	default:
		return "", false
	}
}

type profileFieldsTransport struct{ document, token string }

func (p profileFieldsTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	if request.Method != http.MethodGet || request.URL.String() != "https://login.yandex.ru/info?format=json" || request.Header.Get("Authorization") != "OAuth "+p.token {
		return nil, errors.New("unexpected profile fixture request")
	}

	return &http.Response{
		StatusCode: http.StatusOK,
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader(p.document)),
	}, nil
}

func profileFieldsLogin(ctx context.Context, scenario, origin string) (identity.Profile, error) {
	document, ok := profileFieldsDocument(scenario)
	if !ok {
		return identity.Profile{}, identity.ErrInvalidAttempt
	}

	provider := yandex.New("fixture-profile-client", "fixture-only", origin+"/api/v1/auth/yandex/callback", profileFieldsTransport{document: document, token: scenario})

	return provider.VerifyToken(ctx, scenario)
}
