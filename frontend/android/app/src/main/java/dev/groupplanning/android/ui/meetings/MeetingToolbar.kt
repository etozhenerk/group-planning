package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.CalendarCounts
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.state.CalendarSelection

@Composable
internal fun MeetingToolbar(
    selection: CalendarSelection,
    counts: CalendarCounts?,
    change: (CalendarSelection) -> Unit,
) {
    val large = LocalDensity.current.fontScale > 1.3f
    val period: @Composable (MeetingPeriod, Modifier) -> Unit = { value, modifier ->
        val count = counts?.let { if (value == MeetingPeriod.Past) it.past else it.upcoming }
        MeetingPeriodButton(value, count, selection.period == value, modifier) {
            change(selection.copy(period = value, undated = false))
        }
    }
    val display: @Composable (Boolean, Modifier) -> Unit = { calendar, modifier ->
        MeetingDisplayButton(calendar, selection.calendar == calendar, modifier) {
            change(selection.copy(calendar = calendar))
        }
    }
    val group = Modifier.background(colorResource(R.color.navigation), RoundedCornerShape(12.dp))
        .padding(4.dp)

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (large) {
            Column(verticalArrangement = Arrangement.spacedBy(23.dp)) {
                period(MeetingPeriod.Upcoming, Modifier.fillMaxWidth())
                period(MeetingPeriod.Past, Modifier.fillMaxWidth())
            }
            Column(group.fillMaxWidth()) {
                display(false, Modifier.fillMaxWidth())
                display(true, Modifier.fillMaxWidth())
            }
        } else {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(23.dp)) {
                period(MeetingPeriod.Upcoming, Modifier)
                period(MeetingPeriod.Past, Modifier)
            }
            Row(group, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                display(false, Modifier)
                display(true, Modifier)
            }
        }
    }
}
