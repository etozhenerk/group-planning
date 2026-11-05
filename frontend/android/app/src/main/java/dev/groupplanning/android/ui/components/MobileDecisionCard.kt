package dev.groupplanning.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.ui.feed.FeedAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun MobileDecisionCard(
    entry: FeedEntry,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Row(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
    ) {
        FeedAvatar(entry.actor.displayName, entry.actor.avatarUrl)
        Column(
            Modifier.weight(1f).widthIn(max = DesignTokens.componentMobileDecisionCardMaximumWidth),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            Surface(
                shape = RoundedCornerShape(
                    topStart = DesignTokens.componentMobileMessageCornerRadius,
                    topEnd = DesignTokens.componentMobileDecisionCardRadius,
                    bottomStart = DesignTokens.componentMobileDecisionCardRadius,
                    bottomEnd = DesignTokens.componentMobileDecisionCardRadius,
                ),
                color = DesignTokens.colorMessage,
                contentColor = DesignTokens.colorText,
                border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorLine),
            ) {
                Column(Modifier.fillMaxWidth().padding(DesignTokens.spaceS16), content = content)
            }
            Row(
                Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS4),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    entry.actor.displayName,
                    Modifier.weight(1f),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
                Text(
                    entry.occurredAt.instant.atZone(
                        ZoneId.systemDefault(),
                    ).format(DateTimeFormatter.ofPattern("HH:mm")),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
            }
        }
    }
}
