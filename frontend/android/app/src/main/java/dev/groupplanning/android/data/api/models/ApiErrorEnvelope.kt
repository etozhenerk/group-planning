package dev.groupplanning.android.data.api.models

import kotlinx.serialization.Serializable

@Serializable
internal data class ApiErrorEnvelope(val error: ApiProblem)
