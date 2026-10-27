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
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.data.drafts.Repetition
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

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
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFormGroupGap)) {
        FormField(
            stringResource(R.string.meeting_title_field),
            value.title,
            stringResource(R.string.meeting_title_hint),
            editable,
        ) { title ->
            change { it.copy(title = title) }
        }
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(
                DesignTokens.componentMobileFormTwoFieldGap,
            ),
        ) {
            DateTimeField(
                stringResource(R.string.meeting_day_field),
                value.day?.let {
                    LocalDate.parse(
                        it,
                    ).format(
                        DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("ru")),
                    )
                } ?: stringResource(R.string.meeting_date_placeholder),
                R.drawable.ic_calendar,
                editable,
                Modifier.weight(1f),
            ) {
                focus.clearFocus()
                datePicker = true
            }
            DateTimeField(
                stringResource(R.string.meeting_time_field),
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
        FormField(
            stringResource(R.string.meeting_place_field),
            value.place,
            stringResource(R.string.meeting_place_hint),
            editable,
        ) { place ->
            change { it.copy(place = place) }
        }
        FormField(
            stringResource(R.string.meeting_description_field),
            value.description,
            stringResource(R.string.meeting_description_hint),
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
