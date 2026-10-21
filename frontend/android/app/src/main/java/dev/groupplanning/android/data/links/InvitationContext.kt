package dev.groupplanning.android.data.links

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

internal interface InvitationStorage {
    fun load(): String?
    fun save(token: String?)
}

internal class InvitationContext(
    private val storage: InvitationStorage,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    private val mutex = Mutex()

    suspend fun load(): InvitationTarget.Token? = mutex.withLock {
        withContext(io) {
            storage.load()?.let {
                if (!InvitationLinks.validToken(it)) throw ClientFailure(FailureKind.Storage)
                InvitationTarget.Token(it)
            }
        }
    }

    suspend fun save(target: InvitationTarget.Token?) = mutex.withLock {
        withContext(io) { storage.save(target?.value) }
    }
}
