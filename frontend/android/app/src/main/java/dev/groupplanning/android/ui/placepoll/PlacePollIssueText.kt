package dev.groupplanning.android.ui.placepoll

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.placepoll.PlacePollIssue

@Composable
internal fun placeIssueText(issue: PlacePollIssue): String = stringResource(
    when (issue) {
        PlacePollIssue.Load -> R.string.place_poll_load
        PlacePollIssue.Unconfirmed -> R.string.place_poll_unconfirmed
        PlacePollIssue.Conflict -> R.string.place_poll_conflict
        PlacePollIssue.Closed -> R.string.place_poll_finished
        PlacePollIssue.Active -> R.string.place_poll_active
        PlacePollIssue.Place -> R.string.place_poll_invalid
        PlacePollIssue.Explanation -> R.string.place_poll_explanation_invalid
        PlacePollIssue.Unchanged -> R.string.place_poll_unchanged
        PlacePollIssue.Deadline -> R.string.place_poll_deadline
        PlacePollIssue.Rejected -> R.string.place_poll_rejected
        PlacePollIssue.Forbidden -> R.string.poll_forbidden
    },
)
