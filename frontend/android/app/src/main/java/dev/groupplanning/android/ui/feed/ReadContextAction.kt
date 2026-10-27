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
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReadContextAction(enabled: Boolean, open: () -> Unit) {
    Column {
        HorizontalDivider(color = DesignTokens.colorBorderStrong)
        Text(
            stringResource(R.string.chat_read_who),
            Modifier.fillMaxWidth().heightIn(min = DesignTokens.targetAndroid)
                .clickable(enabled = enabled, onClick = open).padding(
                    horizontal = DesignTokens.spaceS16,
                    vertical = DesignTokens.spaceS12,
                ).testTag("chat-read-context"),
            fontSize = DesignTokens.typographySizeBody,
            lineHeight = DesignTokens.typographySizeBody * DesignTokens.typographyLineHeightBody,
            color = DesignTokens.colorText,
        )
    }
}
