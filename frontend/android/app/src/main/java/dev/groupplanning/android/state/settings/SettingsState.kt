package dev.groupplanning.android.state.settings

import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.UpdateMeeting
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.MeetingDraft
import java.util.UUID

internal data class SettingsState(
    val original: Meeting,
    val draft: MeetingDraft = original.settingsDraft(),
    val busy: Boolean = false,
    val pending: SettingsSubmission? = null,
    val issue: SettingsIssue? = null,
    val validation: DraftIssue? = null,
    val saved: Boolean = false,
) {
    val dirty: Boolean get() = draft != original.settingsDraft()
    val editable: Boolean get() = !busy &&
        pending == null &&
        issue != SettingsIssue.Conflict &&
        issue != SettingsIssue.Forbidden
}

internal data class SettingsSubmission(val input: UpdateMeeting, val key: UUID = UUID.randomUUID())
internal enum class SettingsIssue { Load, Unconfirmed, Conflict, Forbidden, Rejected }
