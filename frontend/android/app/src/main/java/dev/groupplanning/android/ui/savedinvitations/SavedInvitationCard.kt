package dev.groupplanning.android.ui.savedinvitations

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import dev.groupplanning.android.data.api.models.MeetingSummary
import dev.groupplanning.android.data.api.models.SavedInvitation
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.ui.meetings.MeetingCard

@Composable
internal fun SavedInvitationCard(item: SavedInvitation, select: () -> Unit) {
    val preview = item.preview
    val meeting = MeetingSummary(
        id = preview.meetingId, title = preview.title,
        startsAt = preview.startsAt, startsOn = preview.startsOn, timezone = preview.timezone,
        place = preview.place, coverUrl = preview.coverUrl, participantCount = 0,
        revision = ServerCounter.Zero, myRsvp = preview.myRsvp,
        myRsvpRevision = preview.myRsvpRevision,
    )
    Box(Modifier.testTag("saved-invitation-${preview.meetingId}")) {
        MeetingCard(
            meeting,
            inviter = preview.organizer?.displayName,
            invitation = true,
            onClick = select,
        )
    }
}
