package dev.groupplanning.android.ui.invitation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.state.InvitationState

@Composable
internal fun RsvpAction(
    state: InvitationState,
    answer: RsvpAnswer,
    respond: (RsvpAnswer) -> Unit,
    modifier: Modifier = Modifier,
    compact: Boolean = false,
) {
    val enabled = !state.loading &&
        !state.saving &&
        (state.pending?.input?.answer == answer || state.editable)
    InformationAction(
        stringResource(answer.label()),
        { respond(answer) },
        modifier.testTag(if (compact) "information-rsvp-${answer.name}" else "rsvp-${answer.name}")
            .semantics { selected = state.answer == answer },
        primary = if (compact) state.answer == answer else answer == RsvpAnswer.Going,
        selected = !compact && state.answer == answer,
        small = !compact && answer != RsvpAnswer.Going,
        enabled = enabled,
    )
}
