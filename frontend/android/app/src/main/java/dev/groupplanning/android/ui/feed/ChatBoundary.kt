package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ChatBoundary(loading: Boolean, error: Boolean, retry: () -> Unit) {
    val label = stringResource(R.string.chat_history_loading)
    if (loading) {
        Column(
            Modifier.fillMaxWidth().padding(vertical = DesignTokens.spaceS12)
                .testTag("chat-history-loading").clearAndSetSemantics {
                    contentDescription = label
                },
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            repeat(2) {
                Box(
                    Modifier.fillMaxWidth().height(DesignTokens.spaceS24)
                        .background(
                            DesignTokens.colorRaised,
                            RoundedCornerShape(DesignTokens.spaceS8),
                        ),
                )
            }
        }
    } else if (error) {
        Column {
            Text(
                stringResource(R.string.chat_history_error),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeCaption,
            )
            TextButton(retry, Modifier.testTag("chat-history-retry")) {
                Text(stringResource(R.string.message_retry))
            }
        }
    }
}
