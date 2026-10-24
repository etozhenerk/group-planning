package dev.groupplanning.android.state.placepoll

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.models.PlacePoll

internal data class PlacePollState(
    val poll: PlacePoll? = null,
    val busy: Boolean = false,
    val loading: Boolean = false,
    val sendingAnswer: String? = null,
    val pending: ApiRequest? = null,
    val issue: PlacePollIssue? = null,
    val draft: PlacePollDraft? = null,
    val validation: String? = null,
) {
    val editable: Boolean get() = !busy && pending == null
}

internal enum class PlacePollIssue {
    Load,
    Unconfirmed,
    Conflict,
    Closed,
    Active,
    Place,
    Unchanged,
    Deadline,
    Rejected,
    Forbidden,
}
