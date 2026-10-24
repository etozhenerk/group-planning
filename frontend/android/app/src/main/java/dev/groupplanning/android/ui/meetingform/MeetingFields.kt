package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
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
    Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
        FormField(
            "Название",
            value.title,
            "Например, вечер настольных игр",
            editable,
        ) { title ->
            change { it.copy(title = title) }
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            FormField(
                "Описание · необязательно",
                value.description,
                "Что нужно знать друзьям",
                editable,
                minLines = 3,
            ) { text ->
                change { it.copy(description = text) }
            }
            Text(
                "Описание увидят все, у кого есть приглашение.",
                color = Palette.muted,
                fontSize = 12.sp,
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Дата", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            ActionButton(
                value.day?.let {
                    LocalDate.parse(it).format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
                }
                    ?: "Выберите дату",
                Modifier.semantics {
                    contentDescription = "Дата"
                },
                primary = false,
                enabled = editable,
                icon = R.drawable.ic_calendar,
            ) {
                focus.clearFocus()
                datePicker = true
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                stringResource(R.string.meeting_optional_time),
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
            ActionButton(
                value.time ?: "Выберите время",
                Modifier.semantics {
                    contentDescription = "Время"
                },
                primary = false,
                enabled = editable,
                icon = R.drawable.ic_clock,
            ) {
                focus.clearFocus()
                timePicker = true
            }
            if (value.time != null) {
                TextButton(
                    onClick = { change { it.copy(time = null, repetition = null) } },
                    modifier = Modifier.testTag("clear-meeting-time"),
                    enabled = editable,
                ) { Text(stringResource(R.string.meeting_clear_time)) }
            }
            Text(
                stringResource(R.string.meeting_timezone, value.timezone),
                color = Palette.muted,
                fontSize = 12.sp,
            )
        }
        if (ambiguous) {
            ActionButton("Ранний — до перевода часов", primary = false) {
                change { it.copy(repetition = Repetition.Earlier) }
            }
            ActionButton("Поздний — после перевода часов", primary = false) {
                change { it.copy(repetition = Repetition.Later) }
            }
        }
        FormField(
            "Место · необязательно",
            value.place,
            "Адрес, название или ориентир",
            editable,
        ) { place ->
            change { it.copy(place = place) }
        }
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
