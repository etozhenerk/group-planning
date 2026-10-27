package dev.groupplanning.android.data.outbox

import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

internal class MessageOutbox(
    private val storage: MessageStorage,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    private val mutex = Mutex()

    suspend fun read(owner: UUID, meeting: UUID): MessageRecord = mutex.withLock {
        withContext(io) {
            storage.load().firstOrNull { it.owner == owner && it.meeting == meeting }?.normalized()
                ?: MessageRecord(owner, meeting)
        }
    }

    suspend fun update(
        owner: UUID,
        meeting: UUID,
        transform: (MessageRecord) -> MessageRecord,
    ): MessageRecord = mutex.withLock {
        withContext(io) {
            val records = storage.load()
            val old = records.firstOrNull { it.owner == owner && it.meeting == meeting }
                ?: MessageRecord(owner, meeting)
            val next = transform(old.normalized()).normalized()
            require(next.owner == owner && next.meeting == meeting)
            val rest = records.filterNot { it.owner == owner && it.meeting == meeting }
            storage.save(if (next.draft.isEmpty() && next.queue.isEmpty()) rest else rest + next)
            next
        }
    }

    suspend fun retainOwner(owner: UUID) = mutex.withLock {
        withContext(io) { storage.save(storage.load().filter { it.owner == owner }) }
    }

    suspend fun clear(meeting: UUID? = null) = mutex.withLock {
        withContext(io) {
            storage.save(
                if (meeting == null) {
                    emptyList()
                } else {
                    storage.load().filterNot {
                        it.meeting == meeting
                    }
                },
            )
        }
    }
}
