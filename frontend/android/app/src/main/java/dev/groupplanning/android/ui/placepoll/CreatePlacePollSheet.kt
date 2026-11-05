package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.state.placepoll.PlacePollIssue
import dev.groupplanning.android.state.placepoll.PlacePollViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.FormSubmissionNotice
import dev.groupplanning.android.ui.components.RequiredLegend
import dev.groupplanning.android.ui.datepoll.PollDeadlineField
import dev.groupplanning.android.ui.meetingform.CreationFieldHint
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CreatePlacePollSheet(model: PlacePollViewModel, close: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    val draft = state.draft ?: return
    var confirm by remember(model) { mutableStateOf(false) }
    val blocked = state.busy || state.pending != null
    val local = state.validation != null ||
        state.issue in listOf(
            PlacePollIssue.Place,
            PlacePollIssue.Explanation,
            PlacePollIssue.Unchanged,
            PlacePollIssue.Deadline,
        )
    val requestClose = {
        if (!blocked) {
            when {
                confirm -> confirm = false
                model.dirty -> confirm = true
                else -> close()
            }
        }
    }
    LaunchedEffect(state.poll?.id, state.busy) { if (state.poll != null && !state.busy) close() }
    ActionSheet(
        stringResource(if (confirm) R.string.poll_discard_title else R.string.place_poll_title),
        requestClose,
        canClose = !blocked,
        canDismiss = false,
        stickyActions = true,
        actions = if (confirm) {
            null
        } else {
            {
                state.issue?.takeUnless { local }?.let {
                    FormSubmissionNotice(
                        if (state.pending !=
                            null
                        ) {
                            stringResource(R.string.poll_create_unknown_title)
                        } else {
                            placeIssueText(it)
                        },
                        stringResource(
                            if (state.pending != null) {
                                R.string.poll_create_unknown_body
                            } else {
                                R.string.place_create_error_body
                            },
                        ),
                    )
                }
                CompactButton(
                    stringResource(
                        when {
                            state.pending != null -> R.string.poll_retry_send
                            state.issue != null && !local -> R.string.poll_create_retry
                            else -> R.string.place_poll_title
                        },
                    ),
                    Modifier.fillMaxWidth().testTag("place-poll-create"),
                    busy = state.busy,
                    primary = true,
                    click = model::create,
                )
            }
        },
    ) {
        if (confirm) {
            Text(stringResource(R.string.place_discard_body), color = DesignTokens.colorMuted)
            CompactButton(
                stringResource(R.string.keep_editing),
                Modifier.fillMaxWidth(),
                primary = true,
                click = { confirm = false },
            )
            CompactButton(
                stringResource(R.string.discard_settings),
                Modifier.fillMaxWidth(),
                click = close,
            )
        } else {
            PlaceCurrentSummary(draft.previousPlace)
            RequiredLegend()
            PlacePollFormFields(state, model)
            PollDeadlineField(draft.deadline, state.editable) { next ->
                model.change { it.copy(deadline = next) }
            }
            if (state.issue ==
                PlacePollIssue.Deadline
            ) {
                CreationFieldHint(placeIssueText(PlacePollIssue.Deadline))
            }
            state.validation?.let { CreationFieldHint(it) }
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
            Text(
                stringResource(R.string.place_form_note),
                fontSize = DesignTokens.typographySizeCaption,
                color = DesignTokens.colorMuted,
            )
        }
    }
}
