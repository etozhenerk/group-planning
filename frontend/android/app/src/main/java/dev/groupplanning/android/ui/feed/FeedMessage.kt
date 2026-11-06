package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

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
    footer: @Composable () -> Unit = {},
    failure: @Composable () -> Unit = {},
) {
    val reactionLabel = stringResource(R.string.reaction_add)
    val interactions = remember { MutableInteractionSource() }
    val bubble = RoundedCornerShape(
        topStart = if (own) {
            DesignTokens.componentMobileChatBubbleRadius
        } else {
            DesignTokens.componentMobileMessageCornerRadius
        },
        topEnd = if (own) {
            DesignTokens.componentMobileMessageCornerRadius
        } else {
            DesignTokens.componentMobileChatBubbleRadius
        },
        bottomEnd = DesignTokens.componentMobileChatBubbleRadius,
        bottomStart = DesignTokens.componentMobileChatBubbleRadius,
    )
    Row(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(
            DesignTokens.componentMobileChatMessageGap,
            if (own) Alignment.End else Alignment.Start,
        ),
        verticalAlignment = Alignment.Top,
    ) {
        if (!own) FeedAvatar(author.displayName, author.avatarUrl)
        Column(
            Modifier.weight(1f, false),
            horizontalAlignment = if (own) Alignment.End else Alignment.Start,
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
                verticalAlignment = Alignment.Bottom,
            ) {
                if (own) failure()
                Column(
                    Modifier.widthIn(
                        min = DesignTokens.componentMobileMessageMinimumWidth,
                    ).width(IntrinsicSize.Max).then(
                        if (reactionAnchor != null) {
                            Modifier.focusProperties {
                                canFocus = true
                            }.focusRequester(reactionAnchor.focus)
                                .onGloballyPositioned {
                                    reactionAnchor.bounds = it.boundsInWindow()
                                    reactionAnchor.contentBounds =
                                        Rect(
                                            it.localToWindow(Offset.Zero),
                                            it.localToWindow(
                                                Offset(
                                                    it.size.width.toFloat(),
                                                    it.size.height.toFloat(),
                                                ),
                                            ),
                                        )
                                }
                        } else {
                            Modifier
                        },
                    ).reactionFeedback(highlighted, interactions, bubble).then(
                        if (react != null) {
                            Modifier.combinedClickable(
                                interactionSource = interactions,
                                indication = null,
                                onClick = {
                                },
                                onLongClickLabel = reactionLabel,
                                onLongClick = react,
                            )
                                .semantics {
                                    customActions =
                                        listOf(
                                            CustomAccessibilityAction(reactionLabel) {
                                                react()
                                                true
                                            },
                                        )
                                }
                        } else {
                            Modifier
                        },
                    )
                        .background(
                            if (body !=
                                null
                            ) {
                                Color.Transparent
                            } else if (own) {
                                Palette.ownMessage
                            } else {
                                DesignTokens.colorSurface
                            },
                            bubble,
                        )
                        .padding(
                            horizontal = if (body ==
                                null
                            ) {
                                DesignTokens.componentMobileMessageInsetInline
                            } else {
                                DesignTokens.spaceS0
                            },
                        )
                        .padding(
                            top = if (body ==
                                null
                            ) {
                                DesignTokens.componentMobileMessageInsetTop
                            } else {
                                DesignTokens.spaceS0
                            },
                            bottom = if (body ==
                                null
                            ) {
                                DesignTokens.componentMobileMessageInsetBottom
                            } else {
                                DesignTokens.spaceS0
                            },
                        ),
                    verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS3),
                ) {
                    if (!own &&
                        body == null
                    ) {
                        Text(
                            author.displayName,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = DesignTokens.typographySizeCaption,
                            color = DesignTokens.colorAccent,
                        )
                    }
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
                    if (body ==
                        null
                    ) {
                        FeedMessageFooter(
                            time,
                            own,
                            footer,
                            delivery,
                            Modifier.align(Alignment.End),
                        )
                    }
                }
            }
            if (body != null) FeedMessageFooter(time, own, footer, delivery)
            status()
        }
        if (own) FeedAvatar(author.displayName, author.avatarUrl)
    }
}
