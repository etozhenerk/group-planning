package dev.groupplanning.android.ui.invitation

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.LinkIssue

@Composable
internal fun LinkProblemDialog(issue: LinkIssue, dismiss: () -> Unit) {
    val title = when (issue) {
        LinkIssue.Invalid -> R.string.invitation_unavailable
        LinkIssue.Storage -> R.string.invitation_context_error
        LinkIssue.Unconfigured -> R.string.invitation_not_configured
    }
    val hint = when (issue) {
        LinkIssue.Invalid -> R.string.invitation_unavailable_hint
        LinkIssue.Storage -> R.string.invitation_context_error_hint
        LinkIssue.Unconfigured -> R.string.invitation_not_configured_hint
    }
    AlertDialog(
        onDismissRequest = dismiss,
        title = { Text(stringResource(title)) },
        text = { Text(stringResource(hint)) },
        confirmButton = { TextButton(dismiss) { Text(stringResource(R.string.understood)) } },
    )
}
