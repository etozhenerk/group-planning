package dev.groupplanning.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun ChatCardEyebrow(entry: FeedEntry, symbol: ChatSymbol, task: Boolean = false) {
    val time = entry.occurredAt.instant.atZone(ZoneId.systemDefault())
        .format(DateTimeFormatter.ofPattern("HH:mm"))
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(
            DesignTokens.componentMobileChatInlineEyebrowGap,
        ),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ChatIcon(
            symbol,
            Modifier.size(DesignTokens.componentMobileChatInlineEyebrowIcon),
            tint = DesignTokens.colorAccent,
        )
        Text(
            if (task) {
                stringResource(R.string.preparation_proposed_by, entry.actor.displayName)
            } else {
                "${entry.actor.displayName} · $time"
            },
            Modifier.weight(1f),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeLabel,
            lineHeight = DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightLabel,
        )
        if (task) {
            Text(
                time,
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeLabel,
                lineHeight =
                DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightLabel,
            )
        } else {
            Surface(
                color = DesignTokens.colorSurface,
                shape = RoundedCornerShape(DesignTokens.componentMobileChatInlineBadgeRadius),
                border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
            ) {
                Text(
                    stringResource(R.string.chat_poll_badge),
                    Modifier.padding(
                        horizontal = DesignTokens.componentMobileChatInlineBadgeInsetInline,
                        vertical = DesignTokens.componentMobileChatInlineBadgeInsetBlock,
                    ),
                    color = DesignTokens.colorMuted,
                    fontSize = DesignTokens.typographySizeLabel,
                    lineHeight =
                    DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightLabel,
                )
            }
        }
    }
}
