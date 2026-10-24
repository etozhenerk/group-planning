package dev.groupplanning.android.ui.datepoll

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.datepoll.DatePollIssue

@Composable
internal fun pollIssueText(issue: DatePollIssue): String = stringResource(
    when (issue) {
        DatePollIssue.Load -> R.string.poll_load_error
        DatePollIssue.Unconfirmed -> R.string.poll_uncertain
        DatePollIssue.Conflict -> R.string.poll_conflict
        DatePollIssue.Closed -> R.string.poll_closed
        DatePollIssue.Active -> R.string.poll_active
        DatePollIssue.Duplicate -> R.string.poll_duplicate
        DatePollIssue.Deadline -> R.string.poll_deadline_error
        DatePollIssue.Rejected -> R.string.poll_rejected
        DatePollIssue.Forbidden -> R.string.poll_forbidden
    },
)
