package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.InvitationsPage
import java.util.UUID

internal data class SavedInvitationsData(
    val page: InvitationsPage? = null,
    val request: UUID? = null,
    val error: ClientFailure? = null,
    val pages: Int = 1,
)
