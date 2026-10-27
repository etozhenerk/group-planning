package dev.groupplanning.android.ui.feed

import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ComposerEditingDeviceTests {
    @Test fun selectionReplacementAndRepeatedInsertionPreserveSurroundingText() {
        val first = TextFieldValue("До XX после", TextRange(3, 5)).insertEmoji("🍕")
        assertEquals("До 🍕 после", first.text)
        val second = first.insertEmoji("❤️")
        assertEquals("До 🍕❤️ после", second.text)
        assertEquals(TextRange(7), second.selection)
        assertEquals("До 🍕❤️! после", second.insertEmoji("!").text)
    }

    @Test fun deletionUsesAndroidGraphemeBoundariesForFamiliesModifiersAndFlags() {
        listOf("👨‍👩‍👧‍👦", "👍🏽", "🇷🇺", "е\u0301", "❤️").forEach { emoji ->
            val input = TextFieldValue("А${emoji}Б", TextRange(1 + emoji.length))
            val deleted = input.deleteGrapheme()
            assertEquals(emoji, "АБ", deleted.text)
            assertEquals(emoji, TextRange(1), deleted.selection)
        }
    }

    @Test fun deletingSelectionOrAtStartDoesNotCorruptAdjacentText() {
        val input = TextFieldValue("А👨‍👩‍👧‍👦Б", TextRange(0))
        assertEquals(input, input.deleteGrapheme())
        val selected = TextFieldValue("АтекстБ", TextRange(6, 1)).deleteGrapheme()
        assertEquals("АБ", selected.text)
        assertEquals(TextRange(1), selected.selection)
    }
}
