package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInformationContent(
    state: InvitationState,
    participants: Participants?,
    participantError: Boolean,
    choose: (RsvpAnswer) -> Unit,
    save: () -> Unit,
    reload: () -> Unit,
    share: () -> Unit,
    settings: () -> Unit,
) {
    val details = state.details ?: return
    MeetingInformationFacts(details.preview)
    state.issue?.let { InvitationProblem(it, !state.loading && !state.saving, reload) }
    participants?.let {
        InvitationParticipants(it)
    }
    if (participantError) {
        InvitationProblem(InvitationIssue.Load, true, reload)
    }
    HorizontalDivider(color = DesignTokens.colorLine)
    if (details.organizer) {
        Column {
            state.shareUrl?.let {
                MeetingInfoAction(
                    stringResource(R.string.invitation_share),
                    share,
                    Modifier.fillMaxWidth().testTag("information-share"),
                ) { ChatIcon(ChatSymbol.Share) }
            }
            MeetingInfoAction(
                stringResource(R.string.meeting_settings),
                settings,
                Modifier.fillMaxWidth().testTag("open-settings"),
            ) { ChatIcon(ChatSymbol.Settings) }
        }
    } else {
        MeetingInformationRsvp(state, choose, save)
    }
}
