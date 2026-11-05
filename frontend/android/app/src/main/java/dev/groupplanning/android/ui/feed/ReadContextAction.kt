package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReadContextAction(
    enabled: Boolean,
    count: ServerCounter?,
    open: (() -> Unit)?,
    status: Boolean = true,
) {
    Column {
        HorizontalDivider(color = DesignTokens.colorBorderStrong)
        if (status && count == null) {
            Column(
                Modifier.padding(
                    horizontal = DesignTokens.spaceS16,
                    vertical = DesignTokens.spaceS12,
                ),
            ) {
                Text(
                    stringResource(R.string.chat_sent),
                    fontSize = DesignTokens.typographySizeSmall,
                )
                Text(
                    stringResource(R.string.chat_read_unknown_hint),
                    fontSize = DesignTokens.typographySizeCaption,
                    color = DesignTokens.colorMuted,
                )
            }
        } else {
            Text(
                if (count != null &&
                    count != ServerCounter.Zero
                ) {
                    stringResource(R.string.chat_read_count, count.value)
                } else {
                    stringResource(R.string.chat_read_who)
                },
                Modifier.fillMaxWidth().heightIn(min = DesignTokens.targetAndroid)
                    .clickable(enabled = enabled && open != null, onClick = {
                        open?.invoke()
                    }).padding(
                        horizontal = DesignTokens.spaceS16,
                        vertical = DesignTokens.spaceS12,
                    ).testTag("chat-read-context"),
                fontSize = DesignTokens.typographySizeBody,
                lineHeight =
                DesignTokens.typographySizeBody * DesignTokens.typographyLineHeightBody,
                color = DesignTokens.colorText,
            )
        }
    }
}
