package dev.groupplanning.android.ui.feed

import androidx.annotation.StringRes
import dev.groupplanning.android.R

internal data class EmojiGroup(
    val id: String,
    @param:StringRes val label: Int,
    val icon: String,
    val categories: Set<String>,
)

internal val emojiGroups = listOf(
    EmojiGroup(
        "faces",
        R.string.emoji_group_faces,
        "☺︎",
        setOf("Smileys & Emotion", "People & Body"),
    ),
    EmojiGroup("nature", R.string.emoji_group_nature, "❀", setOf("Animals & Nature")),
    EmojiGroup("food", R.string.emoji_group_food, "♧", setOf("Food & Drink")),
    EmojiGroup("travel", R.string.emoji_group_travel, "✈︎", setOf("Travel & Places")),
    EmojiGroup("objects", R.string.emoji_group_objects, "☼", setOf("Activities", "Objects")),
    EmojiGroup("symbols", R.string.emoji_group_symbols, "♡", setOf("Symbols", "Flags")),
)
