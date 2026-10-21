package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun InvitationParticipants(value: Participants, count: Int) {
    Column(
        Modifier.testTag("invitation-people"),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Text(
            stringResource(R.string.participants_count, count),
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
        )
        value.participants.forEach { participant ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier.size(44.dp).background(Palette.surface, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(participant.user.displayName.take(1), fontWeight = FontWeight.Bold)
                }
                Column(Modifier.weight(1f)) {
                    Text(participant.user.displayName, fontWeight = FontWeight.SemiBold)
                    Text(
                        stringResource(
                            if (participant.role == "organizer") {
                                R.string.organizer
                            } else {
                                participant.rsvp?.label() ?: R.string.rsvp_no_answer
                            },
                        ),
                        color = Palette.muted,
                        fontSize = 14.sp,
                    )
                }
            }
        }
    }
}
