package httpapi

import (
	"fmt"
	"os"
	"testing"
)

// Extra real OAuth identities are opt-in data for the 30-person review fixture.
func browserFixtureProfiles() []browserProfile {
	profiles := append([]browserProfile(nil), browserProfiles...)
	if os.Getenv("SOMEWHERE_BROWSER_MEETINGS") != "1" {
		return profiles
	}

	for index := 1; index <= 30; index++ {
		profiles = append(profiles, browserProfile{
			code: fmt.Sprintf("roster-%02d", index),
			name: fmt.Sprintf("Участник %02d", index),
		})
	}

	return profiles
}

func TestBrowserMeetingProfilesAreDistinctAndOptIn(t *testing.T) {
	t.Setenv("SOMEWHERE_BROWSER_MEETINGS", "0")
	if _, err := (browserProvider{}).Verify(t.Context(), "roster-01", "fixture"); err == nil {
		t.Fatal("extended profile enabled outside meetings fixture")
	}

	t.Setenv("SOMEWHERE_BROWSER_MEETINGS", "1")
	subjects := map[string]bool{}
	for index := 1; index <= 30; index++ {
		profile, err := (browserProvider{}).Verify(t.Context(), fmt.Sprintf("roster-%02d", index), "fixture")
		if err != nil || profile.Subject == "" || profile.DisplayName == "" || subjects[profile.Subject] {
			t.Fatalf("invalid or repeated OAuth profile at %d", index)
		}

		subjects[profile.Subject] = true
	}

	if len(browserFixtureProfiles()) != len(browserProfiles)+30 {
		t.Fatal("missing roster identities")
	}
}
