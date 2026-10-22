package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.repository.CalendarData
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.theme.Palette
import java.util.UUID

@Composable
internal fun MeetingListScreen(
    data: CalendarData,
    selection: CalendarSelection,
    change: (CalendarSelection) -> Unit,
    create: () -> Unit,
    refresh: () -> Unit,
    more: () -> Unit,
    select: (UUID) -> Unit,
) {
    val scroll = rememberLazyListState()
    val scrolled by remember {
        derivedStateOf {
            scroll.firstVisibleItemIndex > 0 || scroll.firstVisibleItemScrollOffset > 0
        }
    }
    val emptyAccount = data.counts?.total == 0
    val page = data.page.takeIf { data.filter == selection.filter }
    val loading = stringResource(R.string.calendar_loading)
    Column(Modifier.fillMaxSize()) {
        MeetingListHeading(selection.calendar || !emptyAccount, scrolled, create)
        LazyColumn(
            Modifier.weight(1f).fillMaxWidth().testTag("meetings-list"),
            state = scroll,
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            item(key = "toolbar") { MeetingToolbar(selection, data.counts, change) }
            if (selection.calendar) {
                item(key = "calendar") { MeetingCalendar(selection, data.days, change) }
            }
            if ((data.counts?.undated ?: 0) > 0 || selection.undated) {
                item(key = "undated") {
                    TextButton(onClick = { change(selection.copy(undated = !selection.undated)) }) {
                        Text(
                            if (selection.undated) {
                                stringResource(R.string.calendar_back_to_days)
                            } else {
                                stringResource(R.string.calendar_undated, data.counts?.undated ?: 0)
                            },
                            color = Palette.accent,
                        )
                    }
                }
            }
            if (selection.calendar) {
                item(key = "agenda") { CalendarAgenda(data, selection, more, select) }
            }
            if (data.error != null) {
                item(key = "error") {
                    StatusPanel(
                        stringResource(R.string.calendar_error),
                        stringResource(R.string.calendar_retry_message),
                        refresh,
                    )
                }
            }
            if (!selection.calendar && page == null && data.error == null) {
                item(key = "loading") {
                    CircularProgressIndicator(
                        Modifier.semantics { contentDescription = loading },
                        color = Palette.accent,
                    )
                }
            }
            if (emptyAccount && !selection.calendar) {
                item(key = "empty-account") { EmptyMeetings(create) }
            } else if (!selection.calendar && page?.meetings?.isEmpty() == true) {
                item(key = "empty-day") {
                    Text(
                        stringResource(
                            when {
                                selection.undated -> R.string.calendar_undated_empty
                                selection.calendar -> R.string.calendar_day_empty
                                selection.period == MeetingPeriod.Past ->
                                    R.string.calendar_past_empty
                                else -> R.string.calendar_upcoming_empty
                            },
                        ),
                        color = Palette.muted,
                    )
                }
            }
            items(
                page?.meetings.orEmpty().takeIf {
                    !selection.calendar
                }.orEmpty(),
                key = { it.id },
            ) { meeting ->
                if (selection.calendar && !selection.undated) {
                    CalendarMeetingRow(meeting) { select(meeting.id) }
                } else {
                    MeetingCard(meeting) { select(meeting.id) }
                }
            }
            if (!selection.calendar && page?.nextCursor != null) {
                item(key = "more") {
                    ActionButton(
                        stringResource(
                            if (data.more !=
                                null
                            ) {
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
            }
            if (!selection.calendar && data.moreError != null) {
                item(key = "more-error") {
                    Text(stringResource(R.string.calendar_more_error), color = Palette.error)
                }
            }
        }
    }
}
