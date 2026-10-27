package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.theme.DesignTokens

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun MeetingInformationRsvp(
    state: InvitationState,
    choose: (RsvpAnswer) -> Unit,
    save: () -> Unit,
) {
    Column(
        Modifier.testTag("meeting-information-rsvp"),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentParticipantRosterStackGap),
    ) {
        Text(
            stringResource(R.string.participants_my_answer),
            Modifier.testTag("confirmed-rsvp").semantics { liveRegion = LiveRegionMode.Polite },
            fontSize = DesignTokens.typographySizeSectionHeading,
            lineHeight = DesignTokens.typographySizeSectionHeading *
                DesignTokens.typographyLineHeightBody,
            fontWeight = FontWeight(DesignTokens.typographyWeightBold.toInt()),
        )
        if (state.joinClosed) {
            Text(stringResource(R.string.join_closed_title))
            Text(stringResource(R.string.join_closed_body), color = DesignTokens.colorMuted)
        }
        FlowRow(
            Modifier.selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
        ) {
            RsvpAnswer.entries.forEach { answer ->
                InformationAction(
                    stringResource(answer.label()),
                    { choose(answer) },
                    Modifier.testTag("information-rsvp-${answer.name}").semantics {
                        selected = state.choice == answer
                    },
                    primary = state.choice == answer,
                    enabled = state.editable && !(state.joinClosed && answer == RsvpAnswer.Going),
                )
            }
        }
        if (state.answer == RsvpAnswer.Going && state.choice != state.answer) {
            Text(stringResource(R.string.rsvp_leave_hint), color = DesignTokens.colorMuted)
        } else if (state.answer == null) {
            Text(stringResource(R.string.rsvp_chat_hint), color = DesignTokens.colorMuted)
        }
        if (state.canSave || state.pending != null || state.saving) {
            InformationAction(
                stringResource(
                    when {
                        state.saving -> R.string.rsvp_saving
                        state.pending != null -> R.string.rsvp_retry
                        else -> R.string.rsvp_save
                    },
                ),
                save,
                Modifier.fillMaxWidth().testTag("rsvp-save"),
                primary = true,
                enabled = !state.loading && !state.saving,
            )
        }
    }
}
