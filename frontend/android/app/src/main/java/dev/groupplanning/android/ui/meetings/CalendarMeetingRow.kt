package dev.groupplanning.android.ui.meetings

import androidx.compose.runtime.Composable
import dev.groupplanning.android.data.api.models.MeetingSummary

@Composable
internal fun CalendarMeetingRow(meeting: MeetingSummary, open: () -> Unit) {
    MeetingCard(meeting, onClick = open)
}
