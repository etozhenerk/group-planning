package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.state.datepoll.DatePollViewModel
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.meetingform.MeetingTimeDialog
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CreateDatePollSheet(model: DatePollViewModel, close: () -> Unit) {
    val state by model.state.collectAsStateWithLifecycle()
    val draft = state.draft ?: return
    var clock by rememberSaveable { mutableStateOf(false) }
    val sheet = rememberModalBottomSheetState(
        skipPartiallyExpanded = true,
        confirmValueChange = { state.pending == null },
    )
    LaunchedEffect(state.poll?.id) { if (state.poll != null) close() }
    ModalBottomSheet(onDismissRequest = {
        if (state.pending ==
            null
        ) {
            close()
        }
    }, sheetState = sheet) {
        Column(Modifier.imePadding()) {
            Column(
                Modifier.weight(
                    1f,
                    fill = false,
                ).verticalScroll(rememberScrollState()).padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    stringResource(R.string.poll_title),
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                )
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
                Text(stringResource(R.string.poll_deadline), fontWeight = FontWeight.Bold)
                DatePollDayField(
                    stringResource(R.string.poll_deadline_day),
                    checkNotNull(draft.deadline.day),
                    state.editable,
                ) { day ->
                    model.change {
                        it.copy(deadline = it.deadline.copy(day = day, repetition = null))
                    }
                }
                TextButton({
                    clock = true
                }, enabled = state.editable) { Text(checkNotNull(draft.deadline.time)) }
                Text(draft.deadline.timezone, color = Palette.muted)
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
            }
            Column(
                Modifier.padding(horizontal = 24.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                state.issue?.let {
                    Text(
                        pollIssueText(it),
                        color = Palette.error,
                        modifier = Modifier.testTag("poll-error"),
                    )
                }
                state.validation?.let { Text(it, color = Palette.error) }
                ActionButton(
                    stringResource(
                        if (state.pending ==
                            null
                        ) {
                            R.string.poll_create
                        } else {
                            R.string.poll_retry
                        },
                    ),
                    modifier = Modifier.testTag("poll-create"),
                    busy = state.busy,
                    onClick = model::create,
                )
                TextButton(close, enabled = state.pending == null) {
                    Text(stringResource(R.string.poll_cancel))
                }
            }
        }
    }
    if (clock) {
        MeetingTimeDialog(draft.deadline, { clock = false }) { time ->
            model.change { it.copy(deadline = it.deadline.copy(time = time, repetition = null)) }
            clock = false
        }
    }
}
