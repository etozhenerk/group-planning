package dev.groupplanning.android.ui.components

import dev.groupplanning.android.data.api.models.ApiInstant
import java.time.DateTimeException
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

internal fun meetingTime(value: ApiInstant?, zone: String): String {
    if (value == null) return "Дата ещё не выбрана"
    return try {
        DateTimeFormatter.ofPattern("d MMMM · HH:mm", Locale.forLanguageTag("ru"))
            .format(value.instant.atZone(ZoneId.of(zone)))
    } catch (_: DateTimeException) {
        value.value
    }
}
