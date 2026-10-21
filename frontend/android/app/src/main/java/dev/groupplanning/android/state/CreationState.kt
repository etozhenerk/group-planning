package dev.groupplanning.android.state

import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.data.drafts.DraftRecord

internal data class CreationState(
    val record: DraftRecord,
    val ready: Boolean = false,
    val busy: Boolean = false,
    val problem: String? = null,
    val warning: String? = null,
    val ambiguous: Boolean = false,
    val created: CreatedMeeting? = null,
    val closed: Boolean = false,
) {
    val frozen: Boolean get() = record.submission != null
    val editable: Boolean get() = ready && !busy && !frozen
}
