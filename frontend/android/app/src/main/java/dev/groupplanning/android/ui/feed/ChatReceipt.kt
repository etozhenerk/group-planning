package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ChatReceipt(count: ServerCounter?, open: () -> Unit) {
    if (count == null || count == ServerCounter.Zero) return
    TextButton(
        open,
        Modifier.heightIn(min = DesignTokens.targetAndroid).testTag("chat-read-receipt"),
        contentPadding = PaddingValues(DesignTokens.spaceS4),
    ) {
        Text(
            stringResource(R.string.chat_read_count, count.value),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeCaption,
        )
    }
}
