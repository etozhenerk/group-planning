package dev.groupplanning.android.ui.meetings

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.data.api.models.CalendarDay
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import java.time.YearMonth

@Composable
internal fun MeetingCalendar(
    selection: CalendarSelection,
    days: List<CalendarDay>,
    change: (CalendarSelection) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        CalendarMonthControls(selection, change)
        Crossfade(
            YearMonth.from(selection.day),
            animationSpec = tween(if (LocalMotionEnabled.current) 160 else 0),
            label = "calendar-month",
        ) { month ->
            val day = month.atDay(selection.day.dayOfMonth.coerceAtMost(month.lengthOfMonth()))
            CalendarGrid(selection.select(day), days, change)
        }
    }
}
