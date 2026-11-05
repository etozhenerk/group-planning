package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
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
import dev.groupplanning.android.state.datepoll.DatePollIssue
import dev.groupplanning.android.state.datepoll.DatePollViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.FormSubmissionNotice
import dev.groupplanning.android.ui.components.RequiredLegend
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CreateDatePollSheet(model: DatePollViewModel, close: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    val draft = state.draft ?: return
    var confirm by remember(model) { mutableStateOf(false) }
    val blocked = state.busy || state.pending != null
    val requestClose = {
        if (!blocked) {
            when {
                confirm -> confirm = false
                model.dirty -> confirm = true
                else -> close()
            }
        }
    }
    LaunchedEffect(state.poll?.id, state.busy) {
        if (state.poll != null && !state.busy) close()
    }
    ActionSheet(
        stringResource(if (confirm) R.string.poll_discard_title else R.string.action_date_title),
        requestClose,
        canClose = !blocked,
        canDismiss = false,
        stickyActions = true,
        actions = if (confirm) {
            null
        } else {
            {
                val problem = state.validation ?: state.issue?.takeUnless {
                    it == DatePollIssue.Duplicate
                }?.let { pollIssueText(it) }
                if (problem != null) {
                    FormSubmissionNotice(
                        if (state.pending != null) {
                            stringResource(R.string.poll_create_unknown_title)
                        } else {
                            problem
                        },
                        stringResource(
                            if (state.pending != null) {
                                R.string.poll_create_unknown_body
                            } else {
                                R.string.poll_create_error_body
                            },
                        ),
                    )
                }
                CompactButton(
                    stringResource(
                        when {
                            state.pending != null -> R.string.poll_retry_send
                            state.issue != null -> R.string.poll_create_retry
                            else -> R.string.poll_create
                        },
                    ),
                    Modifier.fillMaxWidth().testTag("poll-create"),
                    busy = state.busy,
                    primary = true,
                    click = model::create,
                )
            }
        },
    ) {
        if (confirm) {
            Text(stringResource(R.string.poll_discard_body), color = DesignTokens.colorMuted)
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
            RequiredLegend()
            DatePollOptionsFields(
                draft,
                state.editable,
                state.issue == DatePollIssue.Duplicate,
                model::change,
            )
            DatePollSettingsFields(draft.settings, state.editable) { settings ->
                model.change { it.copy(settings = settings) }
            }
            PollDeadlineField(draft.deadline, state.editable) { deadline ->
                model.change { it.copy(deadline = deadline) }
            }
            DatePollAmbiguousFields(state, model::change)
        }
    }
}
