package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
    val shape = RoundedCornerShape(DesignTokens.componentMobileMessageReactionRadius)
    Box(
        Modifier.defaultMinSize(
            minWidth = DesignTokens.targetAndroid,
            minHeight = DesignTokens.targetAndroid,
        )
            .focusProperties { canFocus = true }.focusRequester(focus)
            .combinedClickable(
                interactionSource = interactions,
                indication = null,
                role = Role.Button,
                onClick = toggle,
                onLongClickLabel = peopleLabel,
                onLongClick = people,
            )
            .semantics {
                selected = reaction.mine
                contentDescription =
                    "${reaction.emoji}, ${reaction.count}" + if (reaction.mine) ", $own" else ""
                customActions = listOf(
                    CustomAccessibilityAction(peopleLabel) {
                        people()
                        true
                    },
                )
            },
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(
            Modifier.heightIn(min = DesignTokens.componentMobileMessageReactionHeight)
                .reactionFeedback(reaction.mine, interactions, shape)
                .background(
                    if (reaction.mine) DesignTokens.colorAccent else DesignTokens.colorBackground,
                    shape,
                )
                .border(
                    DesignTokens.componentReactionChipBorderWidth,
                    if (reaction.mine) DesignTokens.colorAccent else DesignTokens.colorLine,
                    shape,
                )
                .padding(
                    horizontal = DesignTokens.componentMobileMessageReactionInsetInline,
                    vertical = DesignTokens.componentMobileMessageReactionInsetBlock,
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                buildAnnotatedString {
                    append("${reaction.emoji} ")
                    withStyle(SpanStyle(fontSize = DesignTokens.typographySizeLabel)) {
                        append(reaction.count.toString())
                    }
                },
                fontSize = DesignTokens.typographySizeChatMessage,
                color = if (reaction.mine) DesignTokens.colorBackground else DesignTokens.colorText,
            )
        }
    }
}
