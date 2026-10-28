package dev.groupplanning.android.ui.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.repository.EmojiItem
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EmojiGroupsTests {
    @Test fun everyCatalogEmojiHasExactlyOnePresentationGroup() {
        val catalog = apiJson.decodeFromString<List<EmojiItem>>(
            File("../../../contracts/emoji/emoji-ru.json").readText(),
        )
        assertEquals(3944, catalog.size)
        assertEquals(3944, catalog.map { it.emoji }.toSet().size)
        assertEquals(
            listOf("faces", "nature", "food", "travel", "objects", "symbols"),
            emojiGroups.map { it.id },
        )
        assertEquals(listOf("☺︎", "❀", "♧", "✈︎", "☼", "♡"), emojiGroups.map { it.icon })
        catalog.forEach { item ->
            assertEquals(item.emoji, 1, emojiGroups.count { item.category in it.categories })
        }
        emojiGroups.forEach { group ->
            assertTrue(catalog.any { it.category in group.categories })
        }
    }
}
