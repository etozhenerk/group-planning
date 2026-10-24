package dev.groupplanning.android.ui.preparation

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.data.api.models.PreparationTask
import dev.groupplanning.android.state.preparation.PreparationTaskIssue
import java.util.UUID

@Composable
internal fun preparationStatus(task: PreparationTask, user: UUID): String = when (task.state) {
    "offered" -> when {
        task.recipient == null -> stringResource(R.string.preparation_unassigned)
        task.recipient.id == user -> stringResource(R.string.preparation_offered_you)
        else -> stringResource(R.string.preparation_offered_to, task.recipient.displayName)
    }
    "accepted" -> if (task.assignee?.id ==
        user
    ) {
        stringResource(R.string.preparation_assigned_you)
    } else {
        stringResource(R.string.preparation_assigned_to, task.assignee?.displayName.orEmpty())
    }
    "completed" -> stringResource(R.string.preparation_completed, task.updatedBy.displayName)
    "declined" -> stringResource(R.string.preparation_declined, task.updatedBy.displayName)
    "cancelled" -> stringResource(R.string.preparation_cancelled, task.updatedBy.displayName)
    else -> stringResource(R.string.feed_unknown)
}

@Composable
internal fun preparationActionLabel(action: PreparationAction, task: PreparationTask): String =
    stringResource(
        when (action) {
            PreparationAction.Accept -> if (task.recipient ==
                null
            ) {
                R.string.preparation_take
            } else {
                R.string.preparation_accept
            }
            PreparationAction.Decline -> R.string.preparation_decline
            PreparationAction.Cancel -> R.string.preparation_cancel
            PreparationAction.Complete -> R.string.preparation_complete
        },
    )

@Composable
internal fun preparationIssueText(issue: PreparationTaskIssue, creating: Boolean = false): String =
    stringResource(
        when (issue) {
            PreparationTaskIssue.Load -> R.string.preparation_load_error
            PreparationTaskIssue.Unconfirmed -> if (creating) {
                R.string.preparation_create_error
            } else {
                R.string.preparation_action_error
            }
            PreparationTaskIssue.Conflict -> R.string.preparation_conflict
            PreparationTaskIssue.Rejected -> R.string.preparation_rejected
            PreparationTaskIssue.Forbidden -> R.string.poll_forbidden
        },
    )
