package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.ui.theme.Palette
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun FeedEvent(entry: FeedEntry) {
    val text = eventText(entry)
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text, textAlign = TextAlign.Center, color = Palette.muted, fontSize = 13.sp)
        Text(
            entry.occurredAt.instant.atZone(
                ZoneId.systemDefault(),
            ).format(DateTimeFormatter.ofPattern("HH:mm")),
            color = Palette.muted,
            fontSize = 11.sp,
        )
    }
}
