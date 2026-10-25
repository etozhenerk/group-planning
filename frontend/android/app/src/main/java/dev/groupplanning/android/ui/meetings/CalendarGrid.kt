package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.data.api.models.CalendarDay
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.ui.theme.Palette
import java.time.DayOfWeek
import java.time.format.TextStyle
import java.util.Locale

@Composable
internal fun CalendarGrid(
    selection: CalendarSelection,
    days: List<CalendarDay>,
    change: (CalendarSelection) -> Unit,
) {
    val scale = LocalDensity.current.fontScale
    val counts = days.associate { it.date to it.count }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(Modifier.fillMaxWidth().padding(bottom = 9.dp)) {
            DayOfWeek.entries.forEach { day ->
                Text(
                    day.getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("ru")),
                    Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    color = Palette.muted,
                    fontSize = (minOf(11f * scale, 16f) / scale).sp,
                )
            }
        }
        selection.grid.chunked(7).forEach { week ->
            Row(
                Modifier.fillMaxWidth().height(42.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                week.forEach { day ->
                    CalendarDayCell(
                        day,
                        selection.day,
                        counts[day.toString()] ?: 0,
                        Modifier.weight(1f),
                    ) { change(selection.select(day)) }
                }
            }
        }
    }
}
