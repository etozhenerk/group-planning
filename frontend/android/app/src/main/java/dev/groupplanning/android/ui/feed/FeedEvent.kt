package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun FeedEvent(entry: FeedEntry) {
    val text = eventText(entry)
    Column(
        Modifier.fillMaxWidth().padding(vertical = DesignTokens.spaceS4),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentRsvpSystemGap),
    ) {
        Text(
            entry.occurredAt.instant.atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("HH:mm")),
            Modifier.alpha(DesignTokens.componentRsvpSystemTimeOpacity),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.componentRsvpSystemTimeSize.value.sp,
            lineHeight = DesignTokens.componentRsvpSystemTimeLineHeight.value.sp,
        )
        Text(
            text,
            textAlign = TextAlign.Center,
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.componentRsvpSystemTextSize.value.sp,
            lineHeight = DesignTokens.componentRsvpSystemTextLineHeight.value.sp,
        )
    }
}
