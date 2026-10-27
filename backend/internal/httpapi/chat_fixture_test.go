package httpapi

import (
	"context"
	"testing"
	"time"

	"github.com/etozhenerk/group-planning/backend/internal/identity"
	"github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestChatFixtureOptInCapabilities(t *testing.T) {
	for _, platform := range []string{"BROWSER", "IOS", "ANDROID"} {
		t.Run(platform, func(t *testing.T) {
			for _, flags := range []struct{ realtime, read bool }{{false, false}, {true, false}, {true, true}, {false, true}} {
				t.Run(stringFlags(flags.realtime, flags.read), func(t *testing.T) {
					t.Setenv("SOMEWHERE_"+platform+"_CHAT_REALTIME", fixtureFlag(flags.realtime))
					t.Setenv("SOMEWHERE_"+platform+"_CHAT_READ_STATE", fixtureFlag(flags.read))
					auth, err := identity.New(identity.Config{PublicOrigin: "https://fixture.test", SessionTTL: time.Hour}, memory.NewIdentity(), iosFixtureProvider{}, time.Now, func(context.Context, string) (bool, error) { return false, nil })
					if err != nil {
						t.Fatal(err)
					}

					app, stream := chatFixture(t, memory.New(), auth, platform)
					if app.ChatSyncEnabled() != (flags.realtime || flags.read) || app.ChatReadStateEnabled() != flags.read || (stream != nil) != flags.realtime {
						t.Fatal("fixture flags do not match capability")
					}
				})
			}
		})
	}
}

func fixtureFlag(value bool) string {
	if value {
		return "1"
	}

	return ""
}

func stringFlags(realtime, read bool) string {
	return "realtime=" + fixtureFlag(realtime) + "/read=" + fixtureFlag(read)
}
