package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MessageReaction
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReactionChip(
    reaction: MessageReaction,
    focus: FocusRequester,
    toggle: () -> Unit,
    people: () -> Unit,
) {
    val interactions = remember { MutableInteractionSource() }
    val own = stringResource(R.string.own_reaction)
    val peopleLabel = stringResource(R.string.reaction_people)
    Box(
        Modifier.defaultMinSize(
            minWidth = DesignTokens.targetAndroid,
            minHeight = DesignTokens.targetAndroid,
        ).focusProperties { canFocus = true }.focusRequester(focus)
            .reactionFeedback(reaction.mine, interactions, CircleShape)
            .background(
                reactionContainerColor(reaction.mine),
                CircleShape,
            ).combinedClickable(
                interactionSource = interactions,
                indication = null,
                role = Role.Button,
                onClick = toggle,
                onLongClickLabel = peopleLabel,
                onLongClick = people,
            ).semantics {
                selected = reaction.mine
                contentDescription = "${reaction.emoji}, ${reaction.count}" +
                    if (reaction.mine) ", $own" else ""
                customActions = listOf(
                    CustomAccessibilityAction(peopleLabel) {
                        people()
                        true
                    },
                )
            }.padding(
                horizontal = DesignTokens.componentReactionChipPaddingInline,
                vertical = DesignTokens.componentReactionChipPaddingBlock,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            buildAnnotatedString {
                append("${reaction.emoji} ")
                withStyle(SpanStyle(fontSize = DesignTokens.typographySizeLabel)) {
                    append(reaction.count.toString())
                }
                if (reaction.mine) {
                    withStyle(
                        SpanStyle(
                            fontSize = DesignTokens.typographySizeEmojiGroupLabel,
                            color = DesignTokens.colorAccent,
                        ),
                    ) { append(" ✓") }
                }
            },
            fontSize = DesignTokens.typographySizeBody,
        )
    }
}
