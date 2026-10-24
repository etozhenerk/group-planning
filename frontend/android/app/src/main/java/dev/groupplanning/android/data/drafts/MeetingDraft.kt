package dev.groupplanning.android.data.drafts

import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.CreateMeeting
import java.time.DateTimeException
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlinx.serialization.Serializable

@Serializable
internal data class MeetingDraft(
    val timezone: String,
    val title: String = "",
    val description: String = "",
    val place: String = "",
    val day: String? = null,
    val time: String? = null,
    val repetition: Repetition? = null,
) {
    val isEmpty: Boolean
        get() = title.isEmpty() &&
            description.isEmpty() &&
            place.isEmpty() &&
            day == null &&
            time == null

    fun validate(): DraftValidation {
        val name = title.trim()
        if (name.codePointCount(0, name.length) !in 1..120) return DraftValidation(DraftIssue.Title)
        if (description.codePointCount(0, description.length) > 4000) {
            return DraftValidation(DraftIssue.Description)
        }
        if (place.codePointCount(0, place.length) > 500) return DraftValidation(DraftIssue.Place)
        val date = try {
            day?.let(LocalDate::parse)
        } catch (_: DateTimeException) {
            null
        }
            ?: return DraftValidation(DraftIssue.Day)
        val zone = try {
            ZoneId.of(timezone)
        } catch (_: DateTimeException) {
            null
        } ?: return DraftValidation(DraftIssue.Timezone)
        if (time == null) {
            return DraftValidation(
                input = CreateMeeting(
                    title = name,
                    description = description.ifEmpty { null },
                    startsAt = null,
                    timezone = timezone,
                    place = place.ifEmpty { null },
                    startsOn = date.toString(),
                ),
            )
        }
        val clock = try {
            time?.let(LocalTime::parse)
        } catch (_: DateTimeException) {
            null
        }
            ?: return DraftValidation(DraftIssue.Time)
        val local = date.atTime(clock.withSecond(0).withNano(0))
        val offsets = zone.rules.getValidOffsets(local)
        if (offsets.isEmpty()) return DraftValidation(DraftIssue.Nonexistent)
        if (offsets.size > 1 && repetition == null) return DraftValidation(DraftIssue.Ambiguous)
        val offset = if (repetition == Repetition.Later) offsets.last() else offsets.first()
        val instant = local.atOffset(offset).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
        return DraftValidation(
            input = CreateMeeting(
                title = name,
                description = description.ifEmpty { null },
                startsAt = ApiInstant(instant),
                timezone = timezone,
                place = place.ifEmpty { null },
            ),
        )
    }
}

@Serializable
internal enum class Repetition { Earlier, Later }

internal data class DraftValidation(val issue: DraftIssue? = null, val input: CreateMeeting? = null)

internal enum class DraftIssue(val text: String) {
    Title("Название должно содержать от 1 до 120 символов."),
    Description("В описании должно быть не больше 4000 символов."),
    Place("В названии места должно быть не больше 500 символов."),
    Day("Выберите дату встречи."),
    Time("Укажите время встречи."),
    Timezone("Не удалось определить часовой пояс."),
    Nonexistent("В этом часовом поясе такого времени нет. Выберите другое."),
    Ambiguous("Это время встречается дважды. Выберите ранний или поздний вариант."),
}
