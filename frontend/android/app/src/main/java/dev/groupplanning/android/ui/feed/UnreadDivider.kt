package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun UnreadDivider() {
    Row(
        Modifier.padding(vertical = DesignTokens.spaceS12).testTag("chat-unread-divider"),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        HorizontalDivider(Modifier.weight(1f), color = DesignTokens.colorBorderStrong)
        Text(
            stringResource(R.string.chat_unread_divider),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeCaption,
        )
        HorizontalDivider(Modifier.weight(1f), color = DesignTokens.colorBorderStrong)
    }
}
