package meetings

import (
	_ "embed"
	"encoding/json"
	"strings"
)

//go:embed emoji.json
var emojiCatalog []byte

var reactionEmoji = loadReactionEmoji()

func loadReactionEmoji() map[string]string {
	var entries []struct {
		Emoji string `json:"emoji"`
	}
	if err := json.Unmarshal(emojiCatalog, &entries); err != nil {
		panic("invalid bundled emoji catalog")
	}

	result := make(map[string]string, len(entries)*2)
	for _, entry := range entries {
		result[entry.Emoji] = entry.Emoji
		// Unicode permits text-presentation selectors to be omitted by keyboards.
		result[strings.ReplaceAll(entry.Emoji, "\ufe0f", "")] = entry.Emoji
	}

	return result
}

func validReactionEmoji(value string) bool { return reactionEmoji[value] != "" }
