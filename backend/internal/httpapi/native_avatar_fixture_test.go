package httpapi

import "os"

// The opt-in visual check uses a public standard portrait, never a real account.
func nativeAvatarFixtureURL() string {
	if os.Getenv("SOMEWHERE_NATIVE_AVATAR_FIXTURE") == "1" {
		return "https://avatars.yandex.net/get-yapic/0/0-0/islands-200"
	}

	return ""
}
