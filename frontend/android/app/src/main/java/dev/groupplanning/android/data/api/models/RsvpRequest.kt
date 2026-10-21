package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class RsvpRequest(
    val answer: RsvpAnswer,
    @SerialName("expected_revision") val expectedRevision: ServerCounter,
)
