package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.state.placepoll.PlacePollViewModel
import dev.groupplanning.android.ui.components.ActionPage
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.DesignField
import dev.groupplanning.android.ui.datepoll.PollDeadlineField
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CreatePlacePollSheet(model: PlacePollViewModel, close: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    val draft = state.draft ?: return
    LaunchedEffect(state.poll?.id) { if (state.poll != null) close() }
    ActionPage(stringResource(R.string.place_poll_title), state.pending == null, close) {
        DesignField(
            draft.place,
            { value -> model.change { it.copy(place = value) } },
            label = stringResource(R.string.place_poll_field),
            placeholder = stringResource(R.string.place_poll_placeholder),
            enabled = state.editable,
            singleLine = true,
            modifier = Modifier.testTag("place-poll-place"),
        )
        DesignField(
            draft.explanation,
            { value -> model.change { it.copy(explanation = value) } },
            stringResource(R.string.place_poll_explanation),
            stringResource(R.string.place_poll_explanation_hint),
            modifier = Modifier.testTag("place-poll-explanation"),
            enabled = state.editable,
            minHeight = 104.dp,
        )
        PollDeadlineField(draft.deadline, state.editable) { deadline ->
            model.change { it.copy(deadline = deadline) }
        }
        if (state.validation == DraftIssue.Ambiguous.text) {
            TextButton({
                model.change {
                    it.copy(deadline = it.deadline.copy(repetition = Repetition.Earlier))
                }
            }) {
                Text(stringResource(R.string.poll_time_earlier))
            }
            TextButton({
                model.change {
                    it.copy(deadline = it.deadline.copy(repetition = Repetition.Later))
                }
            }) {
                Text(stringResource(R.string.poll_time_later))
            }
        }

        state.issue?.let {
            Text(
                placeIssueText(it),
                color = Palette.error,
                modifier = Modifier.testTag("place-poll-error"),
            )
        }
        state.validation?.let { Text(it, color = Palette.error) }
        CompactButton(
            stringResource(
                if (state.pending ==
                    null
                ) {
                    R.string.place_poll_title
                } else {
                    R.string.poll_retry
                },
            ),
            modifier = Modifier.fillMaxWidth().testTag("place-poll-create"),
            busy = state.busy,
            primary = true,
            click = model::create,
        )
    }
}
