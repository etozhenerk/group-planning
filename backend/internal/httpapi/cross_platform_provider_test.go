package httpapi

import (
	"bytes"
	"strings"
	"testing"
)

type crossPlatformProviderPageData struct {
	Profiles []struct{ Name, URL string }
	Cancel   string
}

func crossPlatformProviderValues(callback func(string) string, cancel string) crossPlatformProviderPageData {
	return crossPlatformProviderPageData{
		Profiles: []struct{ Name, URL string }{
			{Name: "Саша", URL: callback("sasha")},
			{Name: "Лена", URL: callback("lena")},
		},
		Cancel: cancel,
	}
}

func TestCrossPlatformProviderPageContainsBothLogins(t *testing.T) {
	callback := func(code string) string { return "/callback?code=" + code }
	values := crossPlatformProviderValues(callback, "/callback?error=access_denied")
	var page bytes.Buffer
	if err := providerPage.Execute(&page, values); err != nil {
		t.Fatal(err)
	}

	for _, expected := range []string{
		`href="/callback?code=sasha">Войти как Саша</a>`,
		`href="/callback?code=lena">Войти как Лена</a>`,
		`href="/callback?error=access_denied">Отменить вход</a>`,
		"</body></html>",
	} {
		if !strings.Contains(page.String(), expected) {
			t.Fatalf("cross-platform provider is missing %q", expected)
		}
	}
}
