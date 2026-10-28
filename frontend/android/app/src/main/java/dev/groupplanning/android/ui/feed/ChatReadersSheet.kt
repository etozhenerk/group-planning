package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import dev.groupplanning.android.R
import dev.groupplanning.android.state.feed.ChatReadingState
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ChatReadersSheet(
    state: ChatReadingState,
    close: () -> Unit,
    retry: () -> Unit,
    more: () -> Unit,
) {
    ActionSheet(
        stringResource(R.string.chat_read_title),
        close,
        Modifier.testTag("chat-readers"),
        animateClose = true,
        contentViewport = DesignTokens.componentMobileRosterRowHeight * 3 +
            DesignTokens.spaceS12 * 2,
    ) {
        if (state.loading && state.readers.isEmpty()) {
            val loading = stringResource(R.string.chat_read_loading)
            Column(
                Modifier.fillMaxWidth().clearAndSetSemantics { contentDescription = loading },
                verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
            ) {
                repeat(3) {
                    Row(
                        Modifier.heightIn(min = DesignTokens.componentMobileRosterRowHeight),
                        horizontalArrangement = Arrangement.spacedBy(
                            DesignTokens.componentMobileRosterRowGap,
                        ),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            Modifier.size(DesignTokens.componentMobileRosterAvatarSize)
                                .background(DesignTokens.colorRaised, CircleShape),
                        )
                        Box(
                            Modifier.weight(1f).height(DesignTokens.spaceS12)
                                .background(
                                    DesignTokens.colorRaised,
                                    RoundedCornerShape(DesignTokens.spaceS8),
                                ),
                        )
                    }
                }
            }
        }
        if (state.readers.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12)) {
                state.readers.forEach { user ->
                    Row(
                        Modifier.heightIn(min = DesignTokens.componentMobileRosterRowHeight)
                            .testTag("chat-reader-${user.id}"),
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
                        Text(
                            user.displayName,
                            Modifier.weight(1f),
                            fontSize = DesignTokens.typographySizeSmall,
                        )
                    }
                }
            }
        }
        if (state.error) {
            Text(stringResource(R.string.chat_read_error), color = DesignTokens.colorMuted)
            TextButton(retry, Modifier.testTag("chat-readers-retry")) {
                Text(stringResource(R.string.message_retry))
            }
        } else if (!state.loading && state.readers.isEmpty()) {
            Text(stringResource(R.string.chat_read_empty), color = DesignTokens.colorMuted)
        }
        if (state.nextCursor != null && !state.error) {
            TextButton(more, Modifier.testTag("chat-readers-more"), enabled = !state.loading) {
                Text(
                    stringResource(
                        if (state.loading) R.string.chat_read_loading else R.string.chat_read_more,
                    ),
                )
            }
        }
    }
}
