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
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInformationContent(
    state: InvitationState,
    participants: Participants?,
    participantError: Boolean,
    reload: () -> Unit,
    settings: () -> Unit,
) {
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
    state.issue?.takeUnless {
        it in
            setOf(
                InvitationIssue.Unconfirmed,
                InvitationIssue.Conflict,
                InvitationIssue.Rejected,
                InvitationIssue.Share,
            )
    }?.let { InvitationProblem(it, !state.loading && !state.saving, reload) }
    Column {
        HorizontalDivider(color = DesignTokens.colorLine)
        Column(Modifier.padding(top = DesignTokens.spaceS20)) {
            participants?.let { InvitationParticipants(it, information = true) }
            if (participantError) {
                Text(stringResource(R.string.info_people_error), color = DesignTokens.colorError)
                androidx.compose.material3.TextButton(reload) {
                    Text(stringResource(R.string.info_retry))
                }
            }
        }
    }
}
