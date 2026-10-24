package dev.groupplanning.android.state.datepoll

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.models.DatePoll
import java.util.UUID

internal data class DatePollState(
    val poll: DatePoll? = null,
    val selected: Set<UUID> = emptySet(),
    val edited: Boolean = false,
    val busy: Boolean = false,
    val loading: Boolean = false,
    val pending: ApiRequest? = null,
    val issue: DatePollIssue? = null,
    val draft: DatePollDraft? = null,
    val validation: String? = null,
) {
    val editable: Boolean get() = !busy && pending == null
}

internal enum class DatePollIssue {
    Load,
    Unconfirmed,
    Conflict,
    Closed,
    Active,
    Duplicate,
    Deadline,
    Rejected,
    Forbidden,
}
