package dev.groupplanning.android.data.realtime

import java.util.UUID
import kotlinx.coroutines.flow.Flow

internal sealed interface ChatSignal {
    data object Subscribed : ChatSignal
    data object Changed : ChatSignal
    data object Refresh : ChatSignal
    data object Disconnected : ChatSignal
    data object VerifySession : ChatSignal
    data object PersonalChanged : ChatSignal
    data object AccessRevoked : ChatSignal
}

internal fun interface ChatRealtime {
    fun personal(token: String, owner: UUID): Flow<ChatSignal> = kotlinx.coroutines.flow.emptyFlow()
    fun events(token: String, owner: UUID, meeting: UUID): Flow<ChatSignal>
}
