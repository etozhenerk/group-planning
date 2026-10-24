package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingSummary
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingCard(meeting: MeetingSummary, onClick: () -> Unit) {
    Surface(
        onClick,
        Modifier.fillMaxWidth().testTag("meeting-${meeting.id}"),
        shape = RoundedCornerShape(24.dp),
        color = Palette.surface,
    ) {
        Row(
            Modifier.padding(20.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (LocalDensity.current.fontScale <= 1.5f) {
                Surface(shape = RoundedCornerShape(16.dp), color = Palette.message) {
                    Box(Modifier.size(48.dp), contentAlignment = Alignment.Center) {
                        AppIcon(R.drawable.ic_sparkles, tint = Palette.accent)
                    }
                }
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(meeting.title, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(
                    meetingTime(meeting.startsAt, meeting.timezone, meeting.startsOn),
                    color = Palette.muted,
                    fontSize = 14.sp,
                )
                Text(
                    meeting.place ?: "Место пока не выбрано",
                    color = Palette.muted,
                    fontSize = 14.sp,
                )
                Text(
                    "Участников: ${meeting.participantCount}",
                    color = Palette.muted,
                    fontSize = 12.sp,
                )
            }
        }
    }
}
