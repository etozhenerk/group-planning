package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.models.MeetingPeriod
import java.time.LocalDate

internal data class CalendarFilter(
    val period: MeetingPeriod,
    val from: LocalDate? = null,
    val to: LocalDate? = null,
) {
    fun request(cursor: String? = null): ApiRequest = ApiRequest(
        path = listOf("meetings"),
        query = buildMap {
            put("period", period.wire)
            from?.let { put("from", it.toString()) }
            to?.let { put("to", it.toString()) }
            cursor?.let { put("cursor", it) }
        },
    )
}
