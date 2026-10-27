package dev.groupplanning.android.ui.feed

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.geometry.Rect

internal class ReactionAnchor {
    var contentBounds by mutableStateOf(Rect.Zero)
    var bounds by mutableStateOf(Rect.Zero)
    val focus = FocusRequester()
}
