package dev.groupplanning.android.ui.datepoll

import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.ui.meetingform.MeetingDateDialog
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun DatePollDayField(
    label: String,
    day: String,
    enabled: Boolean,
    change: (String) -> Unit,
) {
    var picking by rememberSaveable { mutableStateOf(false) }
    TextButton(
        colors = ButtonDefaults.textButtonColors(
            contentColor = LocalContentColor.current,
        ),
        onClick = {
            picking =
                true
        },
        enabled = enabled,
    ) {
        Text("$label · ${pollDayLabel(day)}")
    }
    if (picking) {
        MeetingDateDialog(MeetingDraft("UTC", day = day), { picking = false }) {
            change(it)
            picking = false
        }
    }
}

internal fun pollDayLabel(day: String): String = LocalDate.parse(day)
    .format(DateTimeFormatter.ofPattern("d MMMM, EEEE", Locale.forLanguageTag("ru")))
