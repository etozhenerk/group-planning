package dev.groupplanning.android.ui.profile

import java.time.LocalDate
import java.time.Month
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

internal fun profileBirthday(value: String?, dayNumber: (Int) -> String): String? {
    if (value == null || !value.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) return null
    val (year, month, day) = value.split('-').map(String::toInt)
    if (month !in 0..12 || day !in 0..31 || year + month + day == 0) return null
    val locale = Locale.forLanguageTag("ru")
    val date = if (month != 0 && day != 0) {
        runCatching { LocalDate.of(if (year == 0) 2000 else year, month, day) }.getOrNull()
            ?: return null
    } else {
        null
    }
    val label = when {
        date != null -> date.format(DateTimeFormatter.ofPattern("d MMMM", locale))
        month != 0 -> Month.of(month).getDisplayName(TextStyle.FULL_STANDALONE, locale)
        day != 0 -> dayNumber(day)
        else -> ""
    }
    if (year == 0) return label
    return when {
        label.isEmpty() -> year.toString()
        month == 0 && day != 0 -> "$label, $year"
        else -> "$label $year"
    }
}
