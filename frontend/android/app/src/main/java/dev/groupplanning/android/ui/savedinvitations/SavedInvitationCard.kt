package dev.groupplanning.android.ui.savedinvitations

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.SavedInvitation
import dev.groupplanning.android.state.covers.CoverSource
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.covers.CoverImage
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SavedInvitationCard(item: SavedInvitation, select: () -> Unit) {
    Surface(
        onClick = select,
        modifier = Modifier.fillMaxWidth().testTag("saved-invitation-${item.preview.meetingId}"),
        shape = RoundedCornerShape(19.dp),
        color = Palette.surface,
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item.preview.coverUrl?.let {
                CoverImage(CoverSource.Remote(it, item.preview.meetingId), thumbnail = true)
            }
            Text(item.preview.title, fontWeight = FontWeight.Bold)
            Text(
                meetingTime(item.preview.startsAt, item.preview.timezone, item.preview.startsOn),
                color = Palette.muted,
            )
            item.preview.place?.let { Text(it, color = Palette.muted) }
            Text(stringResource(R.string.saved_invitation_answer), color = Palette.muted)
        }
    }
}
