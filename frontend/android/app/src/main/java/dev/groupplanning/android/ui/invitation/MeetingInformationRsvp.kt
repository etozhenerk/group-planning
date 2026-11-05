package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.theme.DesignTokens

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun MeetingInformationRsvp(
    state: InvitationState,
    respond: (RsvpAnswer) -> Unit,
    reload: () -> Unit,
) {
    Column(
        Modifier.testTag("meeting-information-rsvp"),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentParticipantRosterStackGap),
    ) {
        Text(
            stringResource(R.string.info_response_warning),
            fontSize = DesignTokens.typographySizeSmall,
            color = DesignTokens.colorMuted,
        )
        state.issue?.takeIf {
            it in
                setOf(
                    InvitationIssue.Unconfirmed,
                    InvitationIssue.Conflict,
                    InvitationIssue.Rejected,
                )
        }?.let { InvitationProblem(it, !state.loading && !state.saving, reload) }
        if (!state.joinClosed || state.pending != null) {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
                verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
            ) {
                RsvpAnswer.entries.forEach { answer ->
                    RsvpAction(state, answer, respond, compact = true)
                }
            }
        }
        if (state.saving) {
            Text(stringResource(R.string.rsvp_saving), color = DesignTokens.colorMuted)
        }
    }
}
