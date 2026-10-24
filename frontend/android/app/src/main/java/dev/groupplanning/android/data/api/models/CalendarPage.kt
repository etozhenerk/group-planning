package dev.groupplanning.android.data.api.models

import java.time.LocalDate
import java.time.ZoneId
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal enum class MeetingPeriod {
    @SerialName("upcoming")
    Upcoming,

    @SerialName("past")
    Past,

    @SerialName("undated")
    Undated,

    ;

    val wire: String get() = name.lowercase()
}

@Serializable
internal data class CalendarCounts(val upcoming: Int, val past: Int, val undated: Int) {
    init {
        require(upcoming >= 0 && past >= 0 && undated >= 0)
    }
    val total: Int get() = upcoming + past + undated
}

@Serializable
internal data class CalendarDay(val date: String, val count: Int) {
    init {
        require(runCatching { LocalDate.parse(date) }.isSuccess)
        require(count >= 0)
    }
}

@Serializable
internal data class CalendarPage(
    val meetings: List<MeetingSummary>,
    @SerialName("next_cursor") val nextCursor: String?,
    @SerialName("as_of") val asOf: ApiInstant,
    val counts: CalendarCounts,
    val days: List<CalendarDay>,
    @SerialName("next_transition_at") val nextTransitionAt: ApiInstant?,
    @SerialName("refresh_after_seconds") val refreshAfterSeconds: Int,
) {
    init {
        require(refreshAfterSeconds > 0)
        meetings.forEach {
            require(runCatching { ZoneId.of(it.timezone) }.isSuccess)
            require(it.period != null)
            if (it.period == MeetingPeriod.Undated) {
                require(it.localDate == null && it.startsAt == null && it.startsOn == null)
            } else {
                require(runCatching { LocalDate.parse(requireNotNull(it.localDate)) }.isSuccess)
                require(it.startsAt != null || it.startsOn == it.localDate)
            }
        }
    }
}
