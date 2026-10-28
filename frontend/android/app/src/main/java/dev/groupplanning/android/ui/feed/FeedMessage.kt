package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun FeedMessage(
    author: UserProfile,
    time: ApiInstant,
    text: String,
    own: Boolean,
    modifier: Modifier = Modifier,
    react: (() -> Unit)? = null,
    highlighted: Boolean = false,
    reactionAnchor: ReactionAnchor? = null,
    status: @Composable () -> Unit = {},
    body: @Composable (() -> Unit)? = null,
    delivery: @Composable () -> Unit = {},
) {
    val avatarInset = with(LocalDensity.current) {
        (DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightBody).toDp() +
            DesignTokens.spaceS8
    }
    val reactionLabel = stringResource(R.string.reaction_add)
    val interactions = remember { MutableInteractionSource() }
    val bubble = RoundedCornerShape(
        topStart = if (own) {
            DesignTokens.componentMobileChatBubbleRadius
        } else {
            DesignTokens.componentMobileChatBubbleCornerRadius
        },
        topEnd = if (own) {
            DesignTokens.componentMobileChatBubbleCornerRadius
        } else {
            DesignTokens.componentMobileChatBubbleRadius
        },
        bottomEnd = DesignTokens.componentMobileChatBubbleRadius,
        bottomStart = DesignTokens.componentMobileChatBubbleRadius,
    )
    Row(
        modifier.fillMaxWidth().padding(
            start = if (own) 20.dp else 0.dp,
            end = if (own) 0.dp else 18.dp,
        ),
        horizontalArrangement = Arrangement.spacedBy(
            DesignTokens.componentMobileChatMessageGap,
            if (own) Alignment.End else Alignment.Start,
        ),
        verticalAlignment = Alignment.Top,
    ) {
        if (!own) {
            Box(Modifier.padding(top = avatarInset)) {
                FeedAvatar(author.displayName, author.avatarUrl)
            }
        }
        Column(
            Modifier.weight(1f, fill = false),
            horizontalAlignment = if (own) Alignment.End else Alignment.Start,
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    author.displayName,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = DesignTokens.typographySizeLabel,
                    lineHeight =
                    DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightBody,
                    color = Palette.muted,
                    modifier = Modifier.weight(1f, false),
                )
                Text(
                    time.instant.atZone(
                        ZoneId.systemDefault(),
                    ).format(DateTimeFormatter.ofPattern("HH:mm")),
                    color = Palette.muted,
                    fontSize = DesignTokens.typographySizeLabel,
                    lineHeight =
                    DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightBody,
                )
                if (own) {
                    Box(
                        Modifier.size(DesignTokens.componentMessageDeliveryIndicatorSize)
                            .testTag("message-delivery-slot"),
                        contentAlignment = Alignment.Center,
                    ) { delivery() }
                }
            }
            Column(
                Modifier.then(
                    if (reactionAnchor != null) {
                        Modifier.focusProperties { canFocus = true }
                            .focusRequester(reactionAnchor.focus).onGloballyPositioned {
                                reactionAnchor.bounds = it.boundsInWindow()
                                // boundsInWindow clips to ancestors; reading needs the actual end.
                                reactionAnchor.contentBounds = Rect(
                                    it.localToWindow(Offset.Zero),
                                    it.localToWindow(
                                        Offset(it.size.width.toFloat(), it.size.height.toFloat()),
                                    ),
                                )
                            }
                    } else {
                        Modifier
                    },
                ).reactionFeedback(
                    highlighted,
                    interactions,
                    bubble,
                ).then(
                    if (react != null) {
                        Modifier.combinedClickable(
                            interactionSource = interactions,
                            indication = null,
                            onClick = {},
                            onLongClickLabel = reactionLabel,
                            onLongClick = react,
                        ).semantics {
                            customActions = listOf(
                                CustomAccessibilityAction(reactionLabel) {
                                    react()
                                    true
                                },
                            )
                        }
                    } else {
                        Modifier
                    },
                ).background(
                    if (own) colorResource(R.color.own_message) else DesignTokens.colorMessage,
                    bubble,
                ).padding(
                    horizontal = DesignTokens.componentMobileChatBubbleInsetInline,
                    vertical = DesignTokens.componentMobileChatBubbleInsetBlock,
                ),
            ) {
                body?.invoke()
                if (text.isNotEmpty()) {
                    Text(
                        text,
                        color = if (own) DesignTokens.colorOwnText else DesignTokens.colorText,
                        fontSize = DesignTokens.typographySizeChatMessage,
                        lineHeight =
                        DesignTokens.typographySizeChatMessage *
                            DesignTokens.typographyLineHeightBody,
                    )
                }
            }
            status()
        }
        if (own) {
            Box(Modifier.padding(top = avatarInset)) {
                FeedAvatar(author.displayName, author.avatarUrl)
            }
        }
    }
}
