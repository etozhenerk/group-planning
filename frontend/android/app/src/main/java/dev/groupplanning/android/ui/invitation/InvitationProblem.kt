package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun InvitationProblem(issue: InvitationIssue, enabled: Boolean, retry: () -> Unit) {
    Column(Modifier.testTag("invitation-problem")) {
        Text(
            stringResource(
                when (issue) {
                    InvitationIssue.Load -> R.string.invitation_load_error
                    InvitationIssue.Unavailable -> R.string.invitation_unavailable
                    InvitationIssue.Unconfirmed -> R.string.rsvp_unconfirmed
                    InvitationIssue.Conflict -> R.string.rsvp_conflict
                    InvitationIssue.Rejected -> R.string.rsvp_rejected
                    InvitationIssue.Share -> R.string.invitation_share_error
                },
            ),
            color = Palette.error,
        )
        if (issue == InvitationIssue.Unavailable) {
            Text(stringResource(R.string.invitation_unavailable_hint), color = Palette.muted)
        } else {
            TextButton(retry, enabled = enabled) {
                Text(
                    stringResource(
                        if (issue in
                            setOf(
                                InvitationIssue.Unconfirmed,
                                InvitationIssue.Conflict,
                                InvitationIssue.Rejected,
                            )
                        ) {
                            R.string.rsvp_refresh
                        } else {
                            R.string.retry
                        },
                    ),
                )
            }
        }
    }
}
