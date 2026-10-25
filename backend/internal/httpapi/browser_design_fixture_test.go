package httpapi

import (
	"context"
	"testing"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
)

// browserDesignProvider uses exactly the native visual fixture's local users.
// It is available only in TestBrowserFixture with SOMEWHERE_BROWSER_DESIGN=1.
type browserDesignProvider struct{ browserProvider }

func (p browserDesignProvider) Verify(ctx context.Context, code, verifier string) (identity.Profile, error) {
	if code == "sasha" {
		code = "design-3"
	} else if code == "lena" {
		code = "design-1"
	}

	names := map[string]string{
		"design-1": "Лена", "design-2": "Миша", "design-3": "Саша",
		"design-4": "Сергей", "design-5": "Катя", "design-6": "Оля",
	}
	if name, ok := names[code]; ok && verifier != "" {
		return identity.Profile{Subject: "ios-ui-" + code, DisplayName: name}, nil
	}

	return p.browserProvider.Verify(ctx, code, verifier)
}

func TestBrowserDesignProviderUsesSharedUsers(t *testing.T) {
	provider := browserDesignProvider{browserProvider{"https://127.0.0.1"}}
	for code, subject := range map[string]string{"sasha": "ios-ui-design-3", "lena": "ios-ui-design-1"} {
		profile, err := provider.Verify(context.Background(), code, "verifier")
		if err != nil || profile.Subject != subject {
			t.Fatal("visual clients did not share the same profile", err)
		}
	}

	if _, err := (browserProvider{}).Verify(context.Background(), "design-3", "verifier"); err == nil {
		t.Fatal("normal browser fixture enabled visual profile")
	}
}
