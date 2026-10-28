package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.repository.CalendarData
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.rememberLoadingVisible
import dev.groupplanning.android.ui.theme.Palette
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

@Composable
internal fun CalendarAgenda(
    data: CalendarData,
    selection: CalendarSelection,
    more: () -> Unit,
    open: (UUID) -> Unit,
) {
    val page = data.pageFor(selection.filter)
    val loading = stringResource(R.string.calendar_loading)
    val showLoading = rememberLoadingVisible(page == null && data.error == null)
    Column(
        Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
            val title = if (selection.undated) {
                stringResource(R.string.calendar_undated_title)
            } else {
                selection.day.format(
                    DateTimeFormatter.ofPattern("EEEE, d MMMM", Locale.forLanguageTag("ru")),
                )
                    .replaceFirstChar(Char::uppercaseChar)
            }
            Text(
                title,
                Modifier.semantics {
                    heading()
                },
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
            )
            if (!selection.undated) {
                val count =
                    data.days.firstOrNull { it.date == selection.day.toString() }?.count ?: 0
                Text(
                    if (page == null) {
                        " "
                    } else {
                        stringResource(R.string.calendar_meetings_count, count)
                    },
                    color = Palette.muted,
                    fontSize = 14.sp,
                )
            }
        }
        if (showLoading) {
            CircularProgressIndicator(
                Modifier.semantics {
                    contentDescription = loading
                },
                color = Palette.accent,
            )
        }
        if (page?.meetings?.isEmpty() == true) {
            Text(
                stringResource(
                    if (selection.undated) {
                        R.string.calendar_undated_empty
                    } else {
                        R.string.calendar_day_empty
                    },
                ),
                color = Palette.muted,
                modifier = Modifier.padding(vertical = 24.dp),
            )
        }
        page?.meetings.orEmpty().forEach { meeting ->
            CalendarMeetingRow(meeting) { open(meeting.id) }
        }
        if (page?.nextCursor != null) {
            ActionButton(
                stringResource(
                    if (data.more != null) {
                        R.string.calendar_more_loading
                    } else {
                        R.string.calendar_more
                    },
                ),
                primary = false,
                enabled = data.more == null && data.request == null,
                onClick = more,
            )
        }
        if (data.moreError != null) {
            Text(stringResource(R.string.calendar_more_error), color = Palette.error)
        }
    }
}
