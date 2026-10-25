package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
internal fun MeetingFields(
    value: MeetingDraft,
    editable: Boolean,
    ambiguous: Boolean,
    change: ((MeetingDraft) -> MeetingDraft) -> Unit,
) {
    var datePicker by rememberSaveable { mutableStateOf(false) }
    var timePicker by rememberSaveable { mutableStateOf(false) }
    val focus = LocalFocusManager.current
    Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
        FormField("Название", value.title, "Например, вечер настольных игр", editable) { title ->
            change { it.copy(title = title) }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            DateTimeField(
                "Дата",
                value.day?.let {
                    LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
                } ?: stringResource(R.string.meeting_date_placeholder),
                R.drawable.ic_calendar,
                editable,
                Modifier.weight(1f),
            ) {
                focus.clearFocus()
                datePicker = true
            }
            DateTimeField(
                "Время",
                value.time ?: stringResource(R.string.meeting_time_placeholder),
                R.drawable.ic_clock,
                editable,
                Modifier.weight(1f),
            ) {
                focus.clearFocus()
                timePicker = true
            }
        }
        if (ambiguous) {
            ActionButton("Ранний — до перевода часов", primary = false) {
                change { it.copy(repetition = Repetition.Earlier) }
            }
            ActionButton("Поздний — после перевода часов", primary = false) {
                change { it.copy(repetition = Repetition.Later) }
            }
        }
        FormField("Место", value.place, "Адрес, название или ориентир", editable) { place ->
            change { it.copy(place = place) }
        }
        FormField(
            "Описание",
            value.description,
            "Что стоит знать друзьям",
            editable,
            minLines = 3,
        ) { text -> change { it.copy(description = text) } }
        if (value.time != null) {
            TextButton(
                onClick = { change { it.copy(time = null, repetition = null) } },
                modifier = Modifier.testTag("clear-meeting-time"),
                enabled = editable,
            ) {
                Text(stringResource(R.string.meeting_clear_time), fontSize = 12.sp)
            }
        }
        Text(
            stringResource(R.string.meeting_timezone, value.timezone),
            color = Palette.muted,
            fontSize = 12.sp,
        )
    }
    if (datePicker) {
        MeetingDateDialog(value, { datePicker = false }) { day ->
            change { it.copy(day = day) }
            datePicker = false
        }
    }
    if (timePicker) {
        MeetingTimeDialog(value, { timePicker = false }) { time ->
            change { it.copy(time = time) }
            timePicker = false
        }
    }
}
