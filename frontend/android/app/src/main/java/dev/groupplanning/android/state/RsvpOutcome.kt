package dev.groupplanning.android.state

import dev.groupplanning.android.data.api.models.RsvpAnswer
import java.util.UUID

internal data class RsvpOutcome(
    val profileId: UUID,
    val meetingId: UUID,
    val answer: RsvpAnswer,
    val title: String,
)
