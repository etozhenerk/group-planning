package dev.groupplanning.android.ui.invitation

import java.time.DateTimeException
import java.time.ZoneId
import java.time.format.TextStyle
import java.util.Locale

internal fun invitationTimezone(identifier: String): String {
    if (identifier == "UTC") return identifier
    return try {
        ZoneId.of(identifier).getDisplayName(TextStyle.FULL, Locale.forLanguageTag("ru"))
    } catch (_: DateTimeException) {
        identifier
    }
}
