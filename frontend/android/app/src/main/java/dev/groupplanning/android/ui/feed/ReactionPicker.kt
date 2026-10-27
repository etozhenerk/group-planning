package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReactionPicker(
    entry: FeedEntry,
    selectedEmoji: Set<String>,
    bounds: Rect,
    anchor: Rect,
    open: Boolean,
    choose: (String) -> Unit,
    close: () -> Unit,
    closed: () -> Unit,
    readers: (() -> Unit)? = null,
) {
    val density = LocalDensity.current
    val edge = with(density) { DesignTokens.componentReactionPickerEdgeInset.roundToPx() }
    val width = with(density) {
        minOf(
            DesignTokens.componentReactionPickerMaximumWidth,
            (bounds.width - edge * 2).coerceAtLeast(0f).toDp(),
        )
    }
    val height = with(density) {
        minOf(
            DesignTokens.componentReactionPickerPreferredFullHeight,
            (bounds.height - edge * 2).coerceAtLeast(0f).toDp(),
        )
    }
    ReactionPopup(bounds, anchor, open, close, closed) {
        // Keep the mode through exit, then start the next popup at its quick size.
        var full by remember { mutableStateOf(false) }
        Surface(
            Modifier.width(width).testTag(if (full) "reaction-full" else "reaction-quick"),
            shape = RoundedCornerShape(
                if (full) {
                    DesignTokens.componentReactionPickerFullRadius
                } else {
                    DesignTokens.componentReactionPickerQuickRadius
                },
            ),
            color = DesignTokens.colorSurface,
            border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
        ) {
            if (full) {
                Column(Modifier.height(height)) {
                    Row(
                        Modifier.fillMaxWidth().padding(
                            horizontal = DesignTokens.componentReactionPickerContextInsetInline,
                            vertical = DesignTokens.componentReactionPickerContextInsetBottom,
                        ),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                stringResource(R.string.reaction_context, entry.actor.displayName),
                                color = DesignTokens.colorAccent,
                                fontSize = DesignTokens.typographySizeEmojiGroupLabel,
                            )
                            Text(
                                entry.messageText.orEmpty(),
                                color = DesignTokens.colorMuted,
                                fontSize = DesignTokens.typographySizeLabel,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        val closeLabel = stringResource(R.string.experience_close)
                        IconButton(
                            close,
                            Modifier.size(DesignTokens.targetAndroid).semantics {
                                contentDescription = closeLabel
                            },
                        ) { ChatIcon(ChatSymbol.Close) }
                    }
                    EmojiPicker(choose, Modifier.weight(1f), selectedEmoji)
                    readers?.let { ReadContextAction(open, it) }
                }
            } else {
                Column {
                    Row(
                        Modifier.padding(DesignTokens.componentReactionPickerQuickInset),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                    ) {
                        listOf("❤️", "👍", "😂", "🔥", "🎉").forEach { emoji ->
                            ReactionChoice(
                                emoji,
                                emoji in selectedEmoji,
                                { choose(emoji) },
                                Modifier.size(DesignTokens.targetAndroid),
                                fontSize = DesignTokens.typographySizeEmojiQuick,
                            )
                        }
                        val more = stringResource(R.string.reaction_more)
                        IconButton(
                            { full = true },
                            Modifier.size(DesignTokens.targetAndroid).semantics {
                                contentDescription = more
                            },
                        ) { ChatIcon(ChatSymbol.More) }
                    }
                    readers?.let { ReadContextAction(open, it) }
                }
            }
        }
    }
}
