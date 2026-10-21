package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.FeedPage
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.outbox.MessageOutbox
import dev.groupplanning.android.data.outbox.MessageRecord
import dev.groupplanning.android.data.outbox.MessageStorage
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.repository.ResourcePhase
import dev.groupplanning.android.data.repository.ResourceState
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.MemoryCredentials
import dev.groupplanning.android.support.ScriptedTransport
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

internal class MemoryMessages : MessageStorage {
    private var encoded = "[]"
    var failWrites = false
    override fun load(): List<MessageRecord> = apiJson.decodeFromString(encoded)
    override fun save(records: List<MessageRecord>) {
        if (failWrites) throw ClientFailure(FailureKind.Storage)
        encoded = apiJson.encodeToString(records)
    }
}

internal class FeedHarness(dispatcher: CoroutineDispatcher) {
    val transport = ScriptedTransport()
    val disk = MemoryMessages()
    val outbox = MessageOutbox(disk, dispatcher)
    val session = SessionRepository(
        ApiClient(ApiOrigin("https://example.test"), transport),
        MemoryCredentials(),
        dispatcher,
        clearPrivate = outbox::clear,
    )
    val repository = FeedRepository(session, outbox)
    val id = Fixtures.meetingId
    val path = "meetings/$id"

    suspend fun login() {
        transport.enqueue(
            "me",
            apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
        )
        session.restore()
        session.beginData {
            it.copy(
                details = mapOf(
                    id to ResourceState(ResourcePhase.Ready, Fixtures.meeting()),
                ),
            )
        }
    }

    fun page(
        vararg sequence: Int,
        more: Boolean = false,
        latest: Int = sequence.lastOrNull() ?: 0,
    ) {
        transport.enqueue(
            "$path/feed",
            apiJson.encodeToString(
                FeedPage(
                    sequence.map {
                        entry(it)
                    },
                    more,
                    ServerCounter.Zero,
                    2,
                    RsvpAnswer.Going,
                    ServerCounter("1"),
                    ServerCounter(latest.toString()),
                ),
            ),
        )
    }

    fun entry(sequence: Int, key: UUID? = null): FeedEntry = FeedEntry(
        UUID(0, sequence.toLong()), id, ServerCounter(sequence.toString()), "message", 1,
        Fixtures.user, Fixtures.expiry,
        JsonObject(
            mapOf(
                "text" to JsonPrimitive("Сообщение $sequence"),
            ),
        ),
        key,
    )
}
