package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.ui.meetingform.DateTimeField
import dev.groupplanning.android.ui.meetingform.MeetingDateDialog
import dev.groupplanning.android.ui.meetingform.MeetingTimeDialog
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun PollDeadlineField(
    value: MeetingDraft,
    enabled: Boolean,
    change: (MeetingDraft) -> Unit,
) {
    var step by rememberSaveable { mutableStateOf(0) }
    val day = value.day?.let {
        LocalDate.parse(
            it,
        ).format(DateTimeFormatter.ofPattern("d MMMM", Locale.forLanguageTag("ru")))
    }.orEmpty()
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFieldGap)) {
        HorizontalDivider(color = DesignTokens.colorLine)
        Text(
            stringResource(R.string.action_poll_deadline),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeCaption,
        )
        BoxWithConstraints {
            val date: @Composable (Modifier) -> Unit = { modifier ->
                DateTimeField(
                    stringResource(R.string.meeting_day_field),
                    day,
                    R.drawable.ic_calendar,
                    enabled,
                    modifier,
                    required = true,
                    leadingIcon = true,
                ) { step = 1 }
            }
            val time: @Composable (Modifier) -> Unit = { modifier ->
                DateTimeField(
                    stringResource(R.string.meeting_time_field),
                    value.time.orEmpty(),
                    R.drawable.ic_clock,
                    enabled,
                    modifier,
                    required = true,
                    leadingIcon = true,
                ) { step = 2 }
            }
            if (androidx.compose.ui.platform.LocalDensity.current.fontScale > 1f) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(
                        DesignTokens.componentMobileDecisionDeadlineGap,
                    ),
                ) {
                    date(Modifier)
                    time(Modifier)
                }
            } else {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(
                        DesignTokens.componentMobileDecisionDeadlineGap,
                    ),
                ) {
                    date(Modifier.weight(1f))
                    time(Modifier.weight(1f))
                }
            }
        }
        Text(
            if (value.timezone == "Europe/Moscow") {
                stringResource(R.string.poll_moscow_time)
            } else {
                android.icu.text.TimeZoneNames.getInstance(Locale.forLanguageTag("ru"))
                    .getExemplarLocationName(value.timezone) ?: value.timezone
            },
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeCaption,
        )
    }
    if (step == 1) {
        MeetingDateDialog(value, { step = 0 }, stringResource(R.string.action_poll_deadline)) {
            change(value.copy(day = it, repetition = null))
            step = 0
        }
    }
    if (step == 2) {
        MeetingTimeDialog(value, { step = 0 }) {
            change(value.copy(time = it, repetition = null))
            step = 0
        }
    }
}
