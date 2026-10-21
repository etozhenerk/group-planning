package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun RsvpForm(
    state: InvitationState,
    authenticated: Boolean,
    choose: (RsvpAnswer) -> Unit,
    save: () -> Unit,
) {
    var loginNotice by remember { mutableStateOf(false) }
    Surface(shape = RoundedCornerShape(24.dp), color = Palette.surface) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(
                stringResource(
                    if (!authenticated) {
                        R.string.invitation_reply
                    } else {
                        state.answer?.confirmation() ?: R.string.rsvp_question
                    },
                ),
                Modifier.testTag("confirmed-rsvp").semantics { liveRegion = LiveRegionMode.Polite },
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = if (authenticated && state.answer != null) Palette.accent else Palette.text,
            )
            if (authenticated) {
                Column(
                    Modifier.selectableGroup(),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    RsvpAnswer.entries.forEach { answer ->
                        RsvpChoice(answer, state.choice == answer, state.editable) {
                            choose(answer)
                        }
                    }
                }
                if (state.answer == RsvpAnswer.Going && state.choice != state.answer) {
                    Text(
                        stringResource(R.string.rsvp_leave_hint),
                        color = Palette.muted,
                        fontSize = 14.sp,
                    )
                } else if (state.answer == null) {
                    Text(
                        stringResource(R.string.rsvp_chat_hint),
                        color = Palette.muted,
                        fontSize = 14.sp,
                    )
                }
                if (state.canSave || state.pending != null || state.saving) {
                    ActionButton(
                        stringResource(
                            when {
                                state.saving -> R.string.rsvp_saving
                                state.pending != null -> R.string.rsvp_retry
                                else -> R.string.rsvp_save
                            },
                        ),
                        Modifier.testTag("rsvp-save"),
                        enabled = !state.loading && !state.saving,
                        onClick = save,
                    )
                }
            } else {
                Text(stringResource(R.string.invitation_login_hint), color = Palette.muted)
                ActionButton(stringResource(R.string.invitation_login)) { loginNotice = true }
            }
        }
    }
    if (loginNotice) {
        AlertDialog(
            onDismissRequest = { loginNotice = false },
            title = { Text(stringResource(R.string.login_unavailable)) },
            text = { Text(stringResource(R.string.invitation_login_unavailable_hint)) },
            confirmButton = {
                TextButton({ loginNotice = false }) { Text(stringResource(R.string.understood)) }
            },
        )
    }
}
