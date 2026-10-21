package dev.groupplanning.android.data.api.models

import kotlinx.serialization.Serializable

@Serializable
internal data class Participants(val participants: List<Participant>)
