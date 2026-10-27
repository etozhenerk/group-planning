package dev.groupplanning.android.ui.invitation

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.InvitationPreview
import java.time.DateTimeException
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun meetingChatDate(preview: InvitationPreview): String {
    val missing = stringResource(R.string.meeting_date_missing)
    return try {
        val day = preview.startsAt?.instant?.atZone(ZoneId.of(preview.timezone))?.toLocalDate()
            ?: preview.startsOn?.let(LocalDate::parse)
            ?: return missing
        val locale = Locale.forLanguageTag("ru")
        day.format(DateTimeFormatter.ofPattern("EEEE, d MMMM", locale))
            .replaceFirstChar { it.titlecase(locale) }
    } catch (_: DateTimeException) {
        missing
    }
}
