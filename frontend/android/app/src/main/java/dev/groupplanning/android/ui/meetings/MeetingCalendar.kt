package dev.groupplanning.android.ui.meetings

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
    Column(
        Modifier.background(Color(0xff2b2c32), RoundedCornerShape(20.dp))
            .border(1.dp, Color(0x0affffff), RoundedCornerShape(20.dp))
            .padding(horizontal = 14.dp, vertical = 17.dp),
        verticalArrangement = Arrangement.spacedBy(17.dp),
    ) {
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
