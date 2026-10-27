package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MessageReaction
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReactionPeople(
    reactions: List<MessageReaction>,
    initialEmoji: String,
    close: () -> Unit,
) {
    var filter by rememberSaveable(initialEmoji) { mutableStateOf<String?>(initialEmoji) }
    ActionSheet(
        stringResource(R.string.reaction_people),
        close,
        Modifier.testTag("reaction-people"),
    ) {
        Row(
            Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
        ) {
            (listOf<String?>(null) + reactions.map { it.emoji }).forEach { emoji ->
                Surface(
                    { filter = emoji },
                    Modifier.heightIn(min = DesignTokens.targetAndroid)
                        .testTag("reaction-filter-${emoji ?: "all"}").semantics {
                            selected = filter == emoji
                        },
                    shape = RoundedCornerShape(DesignTokens.componentReactionPeopleFilterRadius),
                    color = DesignTokens.colorBackground,
                    border = BorderStroke(
                        DesignTokens.spaceS1,
                        if (filter == emoji) {
                            DesignTokens.colorAccent
                        } else {
                            DesignTokens.colorBackground
                        },
                    ),
                ) {
                    Text(
                        emoji ?: stringResource(R.string.reaction_all),
                        Modifier.padding(
                            horizontal = DesignTokens.componentReactionPeopleFilterInsetInline,
                            vertical = DesignTokens.componentReactionPeopleFilterInsetBlock,
                        ),
                        fontSize = DesignTokens.typographySizeSmall,
                    )
                }
            }
        }
        val filtered = reactions.filter { filter == null || filter == it.emoji }
        val users = filtered.flatMap { it.users }.distinctBy { it.id }
        users.forEach { user ->
            Row(
                Modifier.heightIn(min = DesignTokens.componentMobileRosterRowHeight),
                horizontalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileRosterRowGap,
                ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                UserAvatar(
                    user.displayName,
                    user.avatarUrl,
                    size = DesignTokens.componentMobileRosterAvatarSize,
                )
                Column(Modifier.weight(1f)) {
                    Text(user.displayName, fontSize = DesignTokens.typographySizeSmall)
                }
                Text(
                    filtered.filter { reaction -> reaction.users.any { it.id == user.id } }
                        .joinToString(" ") { it.emoji },
                    fontSize = DesignTokens.typographySizeEmojiCategory,
                )
            }
        }
    }
}
