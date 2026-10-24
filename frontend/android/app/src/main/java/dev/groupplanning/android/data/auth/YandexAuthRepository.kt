package dev.groupplanning.android.data.auth

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.StoredSession
import java.time.Clock
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

internal class YandexAuthRepository(
    private val api: ApiClient,
    private val sessions: SessionRepository,
    private val storage: AuthAttemptStorage,
    private val io: CoroutineDispatcher = Dispatchers.IO,
    private val clock: Clock = Clock.systemUTC(),
) {
    private val mutex = Mutex()

    suspend fun begin(context: AuthContext): Unit = mutex.withLock {
        withContext(io) { storage.save(null) }
        val proof = AuthProof.generate()
        val started = api.send(
            AuthRequests.start(context, proof.challenge),
            AuthRequests.Started.serializer(),
        )
        val valid = runCatching {
            UUID.fromString(started.id).toString() == started.id &&
                started.expiresAt.instant > clock.instant()
        }.getOrDefault(false)
        if (!valid) throw ClientFailure(FailureKind.InvalidResponse)
        withContext(io) {
            storage.save(PendingAuthAttempt(started.id, proof.verifier, started.expiresAt, context))
        }
    }

    suspend fun complete(token: String): AuthContext = mutex.withLock {
        val attempt =
            withContext(io) { storage.load() } ?: throw ClientFailure(FailureKind.InvalidResponse)
        if (attempt.expiresAt.instant <= clock.instant() ||
            token.isEmpty() ||
            token.length > 4096
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        withContext(io) { storage.save(null) }
        val session = api.send(
            AuthRequests.exchange(attempt, token),
            AuthRequests.Session.serializer(),
        )
        if (session.context != attempt.context || session.expiresAt.instant <= clock.instant()) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        sessions.accept(StoredSession(session.token, session.expiresAt))
        session.context
    }

    suspend fun cancel() = mutex.withLock { withContext(io) { storage.save(null) } }
}
