package dev.groupplanning.android.state.placepoll

import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.drafts.MeetingDraft
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

internal data class PlacePollDraft(
    val place: String = "",
    val explanation: String = "",
    val previousPlace: String?,
    val deadline: MeetingDraft,
) {
    companion object {
        fun forMeeting(meeting: Meeting): PlacePollDraft {
            val end = ZonedDateTime.now(ZoneId.of(meeting.timezone)).plusDays(1)
            return PlacePollDraft(
                previousPlace = meeting.place,
                deadline = MeetingDraft(
                    meeting.timezone,
                    title = "Опрос",
                    day = end.toLocalDate().toString(),
                    time = end.format(DateTimeFormatter.ofPattern("HH:mm")),
                ),
            )
        }
    }
}
