package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.components.DetailsSkeleton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInformationContent(
    state: InvitationState,
    participants: Participants?,
    participantError: Boolean,
    loading: Boolean,
    error: Boolean,
    participantLoading: Boolean,
    reload: () -> Unit,
    reloadParticipants: () -> Unit,
    settings: () -> Unit,
) {
    if (loading) {
        DetailsSkeleton(stringResource(R.string.info_loading))
        return
    }
    if (error) {
        MeetingInformationFailure(reload)
        return
    }
    val details = state.details ?: return
    MeetingInformationHeading(
        details.preview,
        participants?.participants?.firstOrNull { it.role == "organizer" }?.user
            ?: details.preview.organizer,
        details.organizer,
        settings,
    )
    MeetingInformationFacts(details.preview)
    details.preview.description?.takeIf { it.isNotBlank() }?.let {
        Text(
            it,
            fontSize = DesignTokens.typographySizeSmall,
            lineHeight =
            DesignTokens.typographySizeSmall *
                DesignTokens.typographyLineHeightMeetingDescription,
            color = DesignTokens.colorMuted,
        )
    }
    Column {
        HorizontalDivider(color = DesignTokens.colorLine)
        Column(Modifier.padding(top = DesignTokens.spaceS20)) {
            InvitationParticipants(
                participants,
                information = true,
                fallbackCount = details.meeting?.participantCount ?: 0,
                loading = participantLoading || (participants == null && !participantError),
                error = participantError,
                retry = reloadParticipants,
            )
        }
    }
}
