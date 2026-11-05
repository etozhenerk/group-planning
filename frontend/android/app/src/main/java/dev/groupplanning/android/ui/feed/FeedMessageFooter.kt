package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun FeedMessageFooter(
    time: ApiInstant,
    own: Boolean,
    reactions: @Composable () -> Unit,
    delivery: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileMessageFooterGap),
        verticalAlignment = Alignment.Bottom,
    ) {
        Box(Modifier.weight(1f)) { reactions() }
        Row(
            horizontalArrangement = Arrangement.spacedBy(
                DesignTokens.componentMobileMessageMetadataGap,
            ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                time.instant.atZone(
                    ZoneId.systemDefault(),
                ).format(DateTimeFormatter.ofPattern("HH:mm")),
                color = if (own) {
                    DesignTokens.colorMobileMessageOwnMetadata
                } else {
                    DesignTokens.colorMuted
                },
                fontSize = DesignTokens.componentMobileMessageMetadataSize.value.sp,
                lineHeight = DesignTokens.componentMobileMessageMetadataLineHeight.value.sp,
            )
            if (own) delivery()
        }
    }
}
