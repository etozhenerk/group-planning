package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import dev.groupplanning.android.data.api.models.CalendarCounts
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingToolbar(
    selection: CalendarSelection,
    counts: CalendarCounts?,
    change: (CalendarSelection) -> Unit,
) {
    val period: @Composable (MeetingPeriod) -> Unit = { value ->
        val count = counts?.let { if (value == MeetingPeriod.Past) it.past else it.upcoming }
        MeetingPeriodButton(value, count, selection.period == value) {
            change(selection.copy(period = value, undated = false))
        }
    }
    Row(
        Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
    ) {
        if (LocalDensity.current.fontScale > 1.3f) {
            Column(Modifier.weight(1f)) {
                period(MeetingPeriod.Upcoming)
                period(MeetingPeriod.Past)
            }
        } else {
            Row(
                Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS20),
            ) {
                period(MeetingPeriod.Upcoming)
                period(MeetingPeriod.Past)
            }
        }
        MeetingDisplayButton(!selection.calendar) {
            change(selection.copy(calendar = !selection.calendar))
        }
    }
}
