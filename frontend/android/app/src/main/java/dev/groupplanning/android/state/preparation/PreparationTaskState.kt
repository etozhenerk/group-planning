package dev.groupplanning.android.state.preparation

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.data.api.models.PreparationTask

internal data class PreparationTaskState(
    val task: PreparationTask? = null,
    val busy: Boolean = false,
    val loading: Boolean = false,
    val sendingAction: PreparationAction? = null,
    val pending: ApiRequest? = null,
    val issue: PreparationTaskIssue? = null,
) {
    val editable: Boolean get() = !busy && pending == null
}

internal enum class PreparationTaskIssue { Load, Unconfirmed, Conflict, Rejected, Forbidden }
