package dev.groupplanning.android.ui.datepoll

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.ui.meetingform.DateTimeField
import dev.groupplanning.android.ui.meetingform.MeetingDateDialog
import dev.groupplanning.android.ui.meetingform.MeetingTimeDialog
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
internal fun PollDeadlineField(
    value: MeetingDraft,
    enabled: Boolean,
    change: (MeetingDraft) -> Unit,
) {
    var step by rememberSaveable { mutableStateOf(0) }
    val day = value.day?.let {
        LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
    }.orEmpty()
    DateTimeField(
        stringResource(R.string.action_poll_deadline),
        "$day, ${value.time.orEmpty()}",
        R.drawable.ic_calendar,
        enabled,
    ) { step = 1 }
    if (step == 1) {
        MeetingDateDialog(value, { step = 0 }) {
            change(value.copy(day = it, repetition = null))
            step = 2
        }
    }
    if (step == 2) {
        MeetingTimeDialog(value, { step = 0 }) {
            change(value.copy(time = it, repetition = null))
            step = 0
        }
    }
}
