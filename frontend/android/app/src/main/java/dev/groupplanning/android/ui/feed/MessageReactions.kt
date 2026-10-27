package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.state.feed.ReactionController
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MessageReactions(
    entry: FeedEntry,
    model: ReactionController,
    anchor: ReactionAnchor,
    readers: (() -> Unit)? = null,
) {
    val state by model.state.collectAsStateWithLifecycle()
    val presentation = LocalChatPresentation.current
    val open = presentation.reaction == entry.id
    var people by remember(entry.id) { mutableStateOf<String?>(null) }
    val focuses = remember(entry.id) { mutableMapOf<String, FocusRequester>() }
    val reactions = state.entries[entry.id].orEmpty()
    val close = { presentation.reaction = null }
    var readAfterClose by remember(entry.id) { mutableStateOf(false) }
    if (reactions.isNotEmpty()) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentReactionChipGap),
        ) {
            reactions.forEach { reaction ->
                key(reaction.emoji) {
                    val focus = focuses.getOrPut(reaction.emoji) { FocusRequester() }
                    ReactionChip(
                        reaction,
                        focus,
                        { model.toggle(entry.id, reaction.emoji) },
                        {
                            presentation.dismiss()
                            people = reaction.emoji
                        },
                    )
                }
            }
        }
    }
    ReactionPicker(
        entry,
        reactions.filter { it.mine }.map { it.emoji }.toSet(),
        presentation.conversationBounds,
        anchor.bounds,
        open,
        {
            if (open) {
                model.toggle(entry.id, it)
                close()
            }
        },
        close,
        {
            if (readAfterClose) {
                readAfterClose = false
                readers?.invoke()
            } else {
                anchor.focus.requestFocus()
            }
        },
        readers = readers?.let { _ ->
            {
                readAfterClose = true
                close()
            }
        },
    )
    if (state.failed?.entry == entry.id) {
        TextButton(model::retry) {
            Text(stringResource(R.string.reaction_retry), color = DesignTokens.colorError)
        }
    }
    people?.let { emoji ->
        ReactionPeople(reactions, emoji) {
            people = null
            if (reactions.any { it.emoji == emoji }) {
                focuses[emoji]?.requestFocus()
            } else {
                anchor.focus.requestFocus()
            }
        }
    }
}
