package dev.groupplanning.android.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ApiInstant
import java.time.DateTimeException
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun meetingTime(value: ApiInstant?, zone: String, startsOn: String? = null): String {
    if (value == null) {
        if (startsOn == null) return stringResource(R.string.meeting_date_missing)
        val day = try {
            LocalDate.parse(startsOn).format(
                DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("ru")),
            )
        } catch (_: DateTimeException) {
            startsOn
        }
        return stringResource(R.string.meeting_date_without_time, day)
    }
    return try {
        DateTimeFormatter.ofPattern("d MMMM · HH:mm", Locale.forLanguageTag("ru"))
            .format(value.instant.atZone(ZoneId.of(zone)))
    } catch (_: DateTimeException) {
        value.value
    }
}
