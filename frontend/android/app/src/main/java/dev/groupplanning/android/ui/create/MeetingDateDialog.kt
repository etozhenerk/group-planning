package dev.groupplanning.android.ui.create

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.data.drafts.MeetingDraft
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun MeetingDateDialog(draft: MeetingDraft, close: () -> Unit, confirm: (String) -> Unit) {
    val day = draft.day?.let(LocalDate::parse) ?: LocalDate.now(ZoneId.of(draft.timezone))
    val picker = rememberDatePickerState(
        initialSelectedDateMillis = day.atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli(),
    )
    DatePickerDialog(onDismissRequest = close, confirmButton = {
        TextButton(
            onClick = {
                picker.selectedDateMillis?.let {
                    confirm(
                        Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate().toString(),
                    )
                }
            },
            enabled = picker.selectedDateMillis != null,
            modifier = Modifier.testTag("date-confirm"),
        ) {
            Text("Готово")
        }
    }, dismissButton = { TextButton(close) { Text("Отмена") } }) {
        DatePicker(picker, title = {
            Text(
                "Дата встречи",
                Modifier.padding(start = 24.dp, top = 16.dp).testTag("date-picker"),
            )
        })
    }
}
