package dev.groupplanning.android.data.api.models

import java.util.UUID

internal data class ReactionIntent(
    val entry: UUID,
    val emoji: String,
    val active: Boolean,
    val key: UUID = UUID.randomUUID(),
)
