package dev.groupplanning.android.support

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.repository.MeetingRepository
import dev.groupplanning.android.data.session.CredentialStorage
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.StoredSession
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.serialization.encodeToString

internal class MemoryCredentials(
    var credential: StoredSession? = StoredSession("test-secret", Fixtures.expiry),
) : CredentialStorage {
    override fun load(): StoredSession? = credential
    override fun save(credential: StoredSession) {
        this.credential = credential
    }
    override fun clear() {
        credential = null
    }
}

internal class SessionHarness(dispatcher: CoroutineDispatcher) {
    val transport = ScriptedTransport()
    val storage = MemoryCredentials()
    val session = SessionRepository(
        ApiClient(ApiOrigin("https://example.test"), transport),
        storage,
        dispatcher,
        Clock.fixed(Instant.parse("2026-10-21T12:00:00Z"), ZoneOffset.UTC),
    )
    val meetings = MeetingRepository(session)

    suspend fun login() {
        transport.enqueue(
            "me",
            apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
        )
        session.restore()
    }
}
