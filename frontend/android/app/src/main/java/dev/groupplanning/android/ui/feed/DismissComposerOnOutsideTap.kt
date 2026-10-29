package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.changedToUpIgnoreConsumed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController

@Composable
internal fun Modifier.dismissComposerOnOutsideTap(presentation: ChatPresentation): Modifier {
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val origin = remember { ChatTapOrigin() }
    return onGloballyPositioned { origin.position = it.positionInWindow() }
        .pointerInput(presentation, focus, keyboard) {
            awaitEachGesture {
                val down = awaitFirstDown(requireUnconsumed = false, PointerEventPass.Initial)
                if (presentation.composerInputBounds.contains(down.position + origin.position)) {
                    presentation.preserveComposerSelection = false
                    return@awaitEachGesture
                }
                if (!presentation.composerInputFocused) return@awaitEachGesture

                // Preserve selection before a child can transfer focus, without changing layout.
                presentation.preserveComposerSelection = true
                try {
                    var tap = true
                    do {
                        // Observe after child handlers, without consuming their click or scroll.
                        val event = awaitPointerEvent(PointerEventPass.Final)
                        val change = event.changes.firstOrNull { it.id == down.id }
                            ?: return@awaitEachGesture
                        if (event.changes.size != 1 ||
                            (change.position - down.position).getDistance() >
                            viewConfiguration.touchSlop ||
                            change.uptimeMillis - down.uptimeMillis >=
                            viewConfiguration.longPressTimeoutMillis
                        ) {
                            tap = false
                        }
                        if (change.changedToUpIgnoreConsumed() &&
                            tap &&
                            presentation.composerInputFocused &&
                            !presentation.composerInputBounds.contains(
                                change.position + origin.position,
                            )
                        ) {
                            focus.clearFocus()
                            keyboard?.hide()
                        }
                    } while (event.changes.any { it.pressed })
                } finally {
                    if (presentation.composerInputFocused) {
                        presentation.preserveComposerSelection = false
                    }
                }
            }
        }
}

private class ChatTapOrigin {
    var position = Offset.Zero
}
