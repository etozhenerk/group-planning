package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.TextUnit
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReactionChoice(
    emoji: String,
    selected: Boolean,
    choose: () -> Unit,
    modifier: Modifier = Modifier,
    label: String = emoji,
    fontSize: TextUnit = DesignTokens.typographySizeEmojiChoice,
) {
    val interactions = remember { MutableInteractionSource() }
    val shape = RoundedCornerShape(DesignTokens.componentEmojiDockChoiceRadius)
    val own = stringResource(R.string.own_reaction)
    Box(
        modifier.reactionFeedback(selected, interactions, shape).background(
            reactionContainerColor(selected),
            shape,
        ).clickable(
            interactions,
            indication = null,
            role = Role.Button,
            onClick = choose,
        ).semantics {
            this.selected = selected
            contentDescription = label + if (selected) ", $own" else ""
        },
        contentAlignment = Alignment.Center,
    ) {
        Text(emoji, fontSize = fontSize)
        if (selected) {
            Text(
                "✓",
                Modifier.align(Alignment.BottomEnd).padding(DesignTokens.spaceS2),
                color = DesignTokens.colorAccent,
                fontSize = DesignTokens.typographySizeEmojiGroupLabel,
            )
        }
    }
}
