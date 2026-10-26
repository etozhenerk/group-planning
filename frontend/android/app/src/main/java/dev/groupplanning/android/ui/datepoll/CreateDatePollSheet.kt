package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.state.datepoll.DatePollViewModel
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate

@Composable
internal fun CreateDatePollSheet(model: DatePollViewModel, close: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    val draft = state.draft ?: return
    LaunchedEffect(state.poll?.id, state.busy) {
        if (state.poll != null && !state.busy) close()
    }
    ActionSheet(stringResource(R.string.action_date_title), close, canClose = !state.busy) {
        draft.dates.forEachIndexed { index, day ->
            Row {
                Column(Modifier.weight(1f)) {
                    DatePollDayField(
                        stringResource(R.string.poll_option, index + 1),
                        day,
                        state.editable,
                    ) { next ->
                        model.change {
                            it.copy(
                                dates = it.dates.mapIndexed { i, old ->
                                    if (i ==
                                        index
                                    ) {
                                        next
                                    } else {
                                        old
                                    }
                                },
                            )
                        }
                    }
                }
                if (draft.dates.size > 2) {
                    TextButton(
                        {
                            model.change {
                                it.copy(
                                    dates = it.dates.filterIndexed { i, _ ->
                                        i !=
                                            index
                                    },
                                )
                            }
                        },
                        enabled = state.editable,
                    ) { Text(stringResource(R.string.poll_remove)) }
                }
            }
        }
        if (draft.dates.size < 20) {
            TextButton(
                {
                    model.change {
                        it.copy(
                            dates =
                            it.dates +
                                LocalDate.parse(it.dates.last()).plusDays(1).toString(),
                        )
                    }
                },
                enabled = state.editable,
            ) { Text(stringResource(R.string.poll_add_date)) }
        }
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
        DatePollSettingsFields(draft.settings, state.editable) { settings ->
            model.change { it.copy(settings = settings) }
        }

        state.issue?.let {
            Text(
                pollIssueText(it),
                color = Palette.error,
                modifier = Modifier.testTag("poll-error"),
            )
        }
        state.validation?.let { Text(it, color = Palette.error) }
        CompactButton(
            stringResource(
                if (state.pending ==
                    null
                ) {
                    R.string.poll_create
                } else {
                    R.string.poll_retry
                },
            ),
            modifier = Modifier.fillMaxWidth().testTag("poll-create"),
            busy = state.busy,
            primary = true,
            click = model::create,
        )
    }
}
