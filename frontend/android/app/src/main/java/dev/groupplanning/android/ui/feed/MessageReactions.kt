package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.MessageReaction
import dev.groupplanning.android.state.feed.ReactionController
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.FloatingPanel
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MessageReactions(entry: FeedEntry, model: ReactionController) {
    val state by model.state.collectAsStateWithLifecycle()
    val quick = state.picker == entry.id
    var full by remember(entry.id) { mutableStateOf(false) }
    var people by remember(entry.id) { mutableStateOf<MessageReaction?>(null) }
    val reactions = state.entries[entry.id].orEmpty()
    val own = stringResource(R.string.own_reaction)
    FlowRow(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        reactions.forEach { reaction ->
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = if (reaction.mine) Color(0x24d6cce9) else Color(0x09ffffff),
                border = BorderStroke(
                    1.dp,
                    if (reaction.mine) Color(0x4ad6cce9) else Color.Transparent,
                ),
            ) {
                Text(
                    "${reaction.emoji} ${reaction.count}",
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    modifier =
                    Modifier.combinedClickable(
                        onClick = { model.toggle(entry.id, reaction.emoji) },
                        onLongClick = { people = reaction },
                    ).padding(horizontal = 9.dp, vertical = 5.dp).semantics {
                        contentDescription =
                            "${reaction.emoji}, ${reaction.count}" +
                            if (reaction.mine) ", $own" else ""
                    },
                )
            }
        }
        if (reactions.isNotEmpty()) {
            val addLabel = stringResource(R.string.reaction_add)
            IconButton(
                { model.pick(entry.id.takeUnless { quick }) },
                Modifier.size(32.dp).semantics {
                    contentDescription = addLabel
                },
            ) { AppIcon(R.drawable.ic_emoji, Modifier.size(19.dp)) }
        }
    }
    if (state.failed?.entry ==
        entry.id
    ) {
        TextButton(model::retry) {
            Text(stringResource(R.string.reaction_retry), color = Palette.error)
        }
    }
    if (quick) {
        FloatingPanel({ model.pick(null) }) {
            FlowRow {
                listOf("❤️", "👍", "😂", "🔥", "🎉").forEach { emoji ->
                    IconButton(
                        {
                            model.toggle(entry.id, emoji)
                            model.pick(null)
                        },
                        Modifier.size(44.dp),
                    ) { Text(emoji, fontSize = 24.sp) }
                }
                IconButton({
                    model.pick(null)
                    full = true
                }, Modifier.size(44.dp)) {
                    AppIcon(R.drawable.ic_plus)
                }
            }
        }
    }
    if (full) {
        EmojiSheet({
            model.toggle(entry.id, it)
            full = false
        }, { full = false })
    }
    people?.let { selected ->
        ActionSheet(stringResource(R.string.reaction_people), { people = null }) {
            FlowRow {
                reactions.forEach { item ->
                    TextButton({ people = item }) { Text(item.emoji) }
                }
            }
            selected.users.forEach { user ->
                FlowRow {
                    UserAvatar(user.displayName, user.avatarUrl)
                    Text(user.displayName, Modifier.padding(DesignTokens.spaceS8))
                }
            }
        }
    }
}
