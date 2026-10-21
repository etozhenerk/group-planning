package dev.groupplanning.android.state.settings

import dev.groupplanning.android.data.api.models.FieldChange
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.UpdateMeeting
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.MeetingDraft
import java.time.ZoneId
import java.time.format.DateTimeFormatter

internal fun Meeting.settingsDraft(): MeetingDraft {
    val date = startsAt?.instant?.atZone(ZoneId.of(timezone))
    return MeetingDraft(
        timezone,
        title,
        description.orEmpty(),
        place.orEmpty(),
        date?.toLocalDate()?.toString(),
        date?.format(DateTimeFormatter.ofPattern("HH:mm")),
    )
}

internal data class SettingsValidation(
    val input: UpdateMeeting? = null,
    val issue: DraftIssue? = null,
)

internal fun settingsPatch(original: Meeting, draft: MeetingDraft): SettingsValidation {
    val before = original.settingsDraft()
    val changedTime =
        before.day != draft.day || before.time != draft.time || draft.repetition != null
    val title = draft.title.trim()
    val issue = when {
        title.codePointCount(0, title.length) !in 1..120 -> DraftIssue.Title
        draft.description.codePointCount(
            0,
            draft.description.length,
        ) > 4000 -> DraftIssue.Description
        draft.place.codePointCount(0, draft.place.length) > 500 -> DraftIssue.Place
        changedTime -> draft.validate().issue
        else -> null
    }
    if (issue != null) return SettingsValidation(issue = issue)
    return SettingsValidation(
        UpdateMeeting(
            expectedRevision = original.revision,
            title = title.takeIf { it != before.title },
            description = fieldChange(before.description, draft.description),
            place = fieldChange(before.place, draft.place),
            startsAt = if (changedTime) draft.validate().input?.startsAt else null,
            timezone = original.timezone.takeIf { changedTime },
        ),
    )
}

private fun fieldChange(before: String, after: String): FieldChange<String> = when {
    before == after -> FieldChange.Unchanged
    after.isEmpty() -> FieldChange.Clear
    else -> FieldChange.Value(after)
}
