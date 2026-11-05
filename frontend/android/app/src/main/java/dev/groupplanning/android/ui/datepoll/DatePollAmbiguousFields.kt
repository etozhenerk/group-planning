package dev.groupplanning.android.ui.datepoll

import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.state.datepoll.DatePollDraft
import dev.groupplanning.android.state.datepoll.DatePollState

@Composable
internal fun DatePollAmbiguousFields(
    state: DatePollState,
    change: ((DatePollDraft) -> DatePollDraft) -> Unit,
) {
    if (state.validation == DraftIssue.Ambiguous.text) {
        TextButton({
            change { it.copy(deadline = it.deadline.copy(repetition = Repetition.Earlier)) }
        }) {
            Text(stringResource(R.string.poll_time_earlier))
        }
        TextButton({
            change { it.copy(deadline = it.deadline.copy(repetition = Repetition.Later)) }
        }) {
            Text(stringResource(R.string.poll_time_later))
        }
    }
}
