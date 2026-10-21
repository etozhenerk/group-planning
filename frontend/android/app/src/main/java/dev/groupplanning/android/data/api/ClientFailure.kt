package dev.groupplanning.android.data.api

import dev.groupplanning.android.data.api.models.ApiProblem

internal enum class FailureKind {
    InvalidOrigin,
    InvalidRequest,
    InvalidResponse,
    Network,
    Http,
    Storage,
    StaleSession,
    AccessRevoked,
}

internal class ClientFailure(
    val kind: FailureKind,
    val status: Int? = null,
    val problem: ApiProblem? = null,
) : Exception(kind.name)
