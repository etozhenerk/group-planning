package dev.groupplanning.android.ui.feed

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.geometry.Rect
import java.util.UUID

internal class ChatPresentation {
    var composerPanel by mutableStateOf<String?>(null)
    var reaction by mutableStateOf<UUID?>(null)
    var conversationBounds by mutableStateOf(Rect.Zero)
    var composerInputBounds = Rect.Zero
    var composerInputFocused = false
    var preserveComposerSelection = false

    companion object {
        val Saver = listSaver<ChatPresentation, String>(
            save = { listOf(it.composerPanel.orEmpty(), it.reaction?.toString().orEmpty()) },
            restore = { values ->
                ChatPresentation().apply {
                    composerPanel = values[0].takeIf { it.isNotEmpty() }
                    reaction = values[1].takeIf { it.isNotEmpty() }?.let(UUID::fromString)
                }
            },
        )
    }

    fun dismiss() {
        composerPanel = null
        reaction = null
    }

    fun react(id: UUID) {
        composerPanel = null
        reaction = id
    }
}

internal val LocalChatPresentation = staticCompositionLocalOf { ChatPresentation() }
