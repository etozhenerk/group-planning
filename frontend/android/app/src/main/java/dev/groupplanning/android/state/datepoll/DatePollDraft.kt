package dev.groupplanning.android.state.datepoll

import dev.groupplanning.android.data.api.models.DatePollSettings
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.drafts.MeetingDraft
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

internal data class DatePollDraft(
    val dates: List<String>,
    val deadline: MeetingDraft,
    val settings: DatePollSettings = DatePollSettings(),
) {
    companion object {
        fun forMeeting(meeting: Meeting): DatePollDraft {
            val zone = ZoneId.of(meeting.timezone)
            val end = ZonedDateTime.now(zone).plusDays(1)
            val first = meeting.startsOn?.let(LocalDate::parse)
                ?: meeting.startsAt?.instant?.atZone(zone)?.toLocalDate() ?: end.toLocalDate()
            return DatePollDraft(
                listOf(first.toString(), first.plusDays(1).toString()),
                MeetingDraft(
                    meeting.timezone,
                    title = "Опрос",
                    day = end.toLocalDate().toString(),
                    time = end.format(DateTimeFormatter.ofPattern("HH:mm")),
                ),
            )
        }
    }
}
