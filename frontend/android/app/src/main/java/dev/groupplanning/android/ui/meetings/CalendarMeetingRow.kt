package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingSummary
import dev.groupplanning.android.ui.theme.Palette
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun CalendarMeetingRow(meeting: MeetingSummary, open: () -> Unit) {
    val clock = meeting.startsAt?.instant?.atZone(ZoneId.of(meeting.timezone))
        ?.format(DateTimeFormatter.ofPattern("HH:mm")).orEmpty()
    val details: @Composable () -> Unit = {
        Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text(meeting.title, fontWeight = FontWeight.SemiBold)
            Text(
                meeting.place ?: stringResource(R.string.calendar_place_missing),
                color = Palette.muted,
                fontSize = 14.sp,
            )
            if (meeting.timezone != ZoneId.systemDefault().id) {
                Text(meeting.timezone, color = Palette.muted, fontSize = 12.sp)
            }
        }
    }
    val modifier = Modifier.fillMaxWidth().testTag("meeting-${meeting.id}")
        .clickable(role = Role.Button, onClick = open).padding(vertical = 8.dp)
    if (LocalDensity.current.fontScale > 1.5f) {
        Column(modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(clock, color = Palette.accent, fontWeight = FontWeight.SemiBold)
            details()
        }
    } else {
        Row(modifier, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(clock, color = Palette.accent, fontWeight = FontWeight.SemiBold)
            details()
        }
    }
}
