package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ClientFailure
import java.util.UUID

internal enum class ResourcePhase { Idle, Loading, Ready, Failed }

internal data class ResourceState<T>(
    val phase: ResourcePhase = ResourcePhase.Idle,
    val value: T? = null,
    val error: ClientFailure? = null,
    val requestId: UUID? = null,
) {
    fun begin(id: UUID): ResourceState<T> = copy(
        phase = ResourcePhase.Loading,
        error = null,
        requestId = id,
    )

    fun cancelled(): ResourceState<T> = copy(
        phase = if (value == null) ResourcePhase.Idle else ResourcePhase.Ready,
        error = null,
        requestId = null,
    )
}
