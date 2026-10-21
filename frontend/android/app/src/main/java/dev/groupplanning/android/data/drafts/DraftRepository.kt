package dev.groupplanning.android.data.drafts

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

internal class DraftRepository(
    private val storage: DraftStorage,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    private val mutex = Mutex()
    private var generation = UUID.randomUUID()

    suspend fun open(owner: UUID): Pair<UUID, DraftRecord?> = mutex.withLock {
        generation = UUID.randomUUID()
        val saved = withContext(io) { storage.load(owner) }
        if (saved != null && saved.owner != owner) throw ClientFailure(FailureKind.Storage)
        generation to saved
    }

    suspend fun save(record: DraftRecord, lease: UUID) = mutex.withLock {
        currentCoroutineContext().ensureActive()
        if (lease != generation) throw ClientFailure(FailureKind.StaleSession)
        withContext(io) { storage.save(record) }
    }

    suspend fun remove(owner: UUID, lease: UUID) = mutex.withLock {
        if (lease != generation) throw ClientFailure(FailureKind.StaleSession)
        withContext(io) { storage.remove(owner) }
        generation = UUID.randomUUID()
    }
}
