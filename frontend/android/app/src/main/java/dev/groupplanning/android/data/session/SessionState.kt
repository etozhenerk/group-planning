package dev.groupplanning.android.data.session

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.data.repository.PrivateData

internal sealed interface SessionState {
    data object SignedOut : SessionState
    data object Restoring : SessionState
    data class Authenticated(val profile: UserProfile) : SessionState
    data class Failed(val error: ClientFailure) : SessionState
}

internal data class ClientSnapshot(
    val session: SessionState = SessionState.SignedOut,
    val data: PrivateData = PrivateData(),
)
