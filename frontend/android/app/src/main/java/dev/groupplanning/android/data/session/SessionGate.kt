package dev.groupplanning.android.data.session

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

internal data class RequestLease(
    val generation: Long,
    val meetingId: UUID?,
    val accessVersion: Long,
)

internal class SessionGate(
    private val storage: CredentialStorage,
    private val io: CoroutineDispatcher,
    private val clearPrivate: suspend (UUID?) -> Unit,
) {
    private val mutex = Mutex()
    val snapshot = MutableStateFlow(ClientSnapshot())
    var credential: StoredSession? = null
    var generation: Long = 0
    var restoreJob: Job? = null
    val requests = mutableMapOf<UUID, Pair<UUID?, Job>>()

    suspend fun <T> locked(block: suspend SessionGate.() -> T): T = mutex.withLock { block() }

    suspend fun <T> storage(block: CredentialStorage.() -> T): T = withContext(io) {
        storage.block()
    }

    fun requireGeneration(expected: Long) {
        if (generation != expected) throw ClientFailure(FailureKind.StaleSession)
    }

    fun lease(request: ApiRequest): RequestLease {
        if (request.meetingId in snapshot.value.data.denied) {
            throw ClientFailure(FailureKind.AccessRevoked)
        }
        return RequestLease(
            generation,
            request.meetingId,
            snapshot.value.data.accessVersion(request.meetingId),
        )
    }

    fun requireLease(lease: RequestLease) {
        requireGeneration(lease.generation)
        val data = snapshot.value.data
        if (lease.meetingId in data.denied ||
            data.accessVersion(lease.meetingId) != lease.accessVersion
        ) {
            throw ClientFailure(FailureKind.AccessRevoked)
        }
    }

    fun reset(except: Job?) {
        generation += 1
        restoreJob?.takeUnless { it === except }?.cancel()
        restoreJob = null
        requests.values.forEach { (_, job) -> if (job !== except) job.cancel() }
        requests.clear()
        credential = null
        snapshot.value = ClientSnapshot(generation = generation)
    }

    suspend fun changeAccess(id: UUID, allowed: Boolean, except: Job? = null) {
        snapshot.value = snapshot.value.copy(data = snapshot.value.data.changeAccess(id, allowed))
        requests.values.forEach { (meetingId, job) ->
            if (meetingId == id && job !== except) job.cancel()
        }
        if (!allowed) withContext(NonCancellable) { clearPrivate(id) }
    }

    suspend fun finishAccountDeletion(except: Job?) {
        clearPrivate(null)
        storage { clear() }
        reset(except)
    }

    suspend fun invalidate(except: Job?) {
        reset(except)
        try {
            try {
                storage { clear() }
            } finally {
                clearPrivate(null)
            }
        } catch (error: ClientFailure) {
            snapshot.value =
                ClientSnapshot(session = SessionState.Failed(error), generation = generation)
            throw error
        }
    }
}
