package dev.groupplanning.android.ui.feed

import android.icu.text.BreakIterator
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue

internal fun TextFieldValue.insertEmoji(emoji: String): TextFieldValue {
    val start = selection.min
    return TextFieldValue(
        text.replaceRange(start, selection.max, emoji),
        TextRange(start + emoji.length),
    )
}

internal fun TextFieldValue.deleteGrapheme(): TextFieldValue {
    if (!selection.collapsed) return insertEmoji("")
    if (selection.start == 0) return this
    val boundaries = BreakIterator.getCharacterInstance()
    boundaries.setText(text)
    val start = boundaries.preceding(selection.start).coerceAtLeast(0)
    val end = if (boundaries.isBoundary(selection.start)) {
        selection.start
    } else {
        boundaries.following(selection.start)
    }
    return TextFieldValue(text.removeRange(start, end), TextRange(start))
}
