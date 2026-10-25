package dev.groupplanning.android.data.session

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.api.requests.SessionRequests
import dev.groupplanning.android.data.repository.PrivateData
import java.time.Clock
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.job
import kotlinx.coroutines.withContext
import kotlinx.serialization.DeserializationStrategy

internal class SessionRepository(
    val api: ApiClient,
    storage: CredentialStorage,
    io: CoroutineDispatcher = Dispatchers.IO,
    private val clock: Clock = Clock.systemUTC(),
    clearPrivate: suspend (UUID?) -> Unit = {},
) {
    private val gate = SessionGate(storage, io, clearPrivate)
    private val deletion = AccountDeletionRepository(gate, api)
    val state: StateFlow<ClientSnapshot> = gate.snapshot.asStateFlow()

    suspend fun accept(candidate: StoredSession) {
        gate.locked {
            if (snapshot.value.session is SessionState.Deleting) {
                throw ClientFailure(
                    FailureKind.StaleSession,
                )
            }
            storage { save(candidate) }
        }
        restore()
    }

    suspend fun restore(candidate: StoredSession? = null): Unit = coroutineScope {
        val owner = currentCoroutineContext().job
        val version = gate.locked {
            reset(owner)
            restoreJob = owner
            snapshot.value =
                ClientSnapshot(session = SessionState.Restoring, generation = generation)
            generation
        }
        try {
            val saved = gate.locked {
                requireGeneration(version)
                candidate ?: storage { load() }
            }
            if (saved?.deletion != null) {
                gate.locked {
                    requireGeneration(version)
                    credential = saved
                    snapshot.value =
                        ClientSnapshot(SessionState.Deleting(), generation = generation)
                }
                return@coroutineScope
            }
            if (saved == null || saved.expiresAt.instant <= clock.instant()) {
                gate.locked {
                    requireGeneration(version)
                    invalidate(owner)
                }
                return@coroutineScope
            }
            val verified = api.send(SessionRequests.Me, CurrentSession.serializer(), saved)
            gate.locked {
                requireGeneration(version)
                currentCoroutineContext().ensureActive()
                if (verified.expiresAt.instant <= clock.instant()) {
                    invalidate(owner)
                } else {
                    val fresh = StoredSession(saved.token, verified.expiresAt)
                    storage { save(fresh) }
                    currentCoroutineContext().ensureActive()
                    credential = fresh
                    snapshot.value =
                        ClientSnapshot(
                            SessionState.Authenticated(verified.user),
                            generation = generation,
                        )
                }
            }
        } catch (cancelled: CancellationException) {
            withContext(NonCancellable) {
                gate.locked { if (generation == version) reset(owner) }
            }
            throw cancelled
        } catch (error: ClientFailure) {
            withContext(NonCancellable) {
                gate.locked {
                    if (generation == version) {
                        if (error.status == 401) {
                            invalidate(owner)
                        } else {
                            snapshot.value =
                                ClientSnapshot(SessionState.Failed(error), generation = generation)
                        }
                    }
                }
            }
        } finally {
            withContext(NonCancellable) {
                gate.locked { if (restoreJob === owner) restoreJob = null }
            }
        }
    }

    suspend fun <T> authenticated(
        request: ApiRequest,
        serializer: DeserializationStrategy<T>,
        expectedGeneration: Long? = null,
        expectedLease: RequestLease? = null,
        apply: (PrivateData, T) -> PrivateData = { data, _ -> data },
    ): T = perform(request, expectedGeneration, expectedLease, apply) { saved ->
        api.send(request, serializer, saved)
    }

    suspend fun image(request: ApiRequest, lease: RequestLease): ByteArray =
        perform(request, lease.generation, lease) { saved -> api.image(request, saved) }

    suspend fun content(request: ApiRequest, lease: RequestLease): ByteArray =
        perform(request, lease.generation, lease) { saved -> api.content(request, saved) }

    private suspend fun <T> perform(
        request: ApiRequest,
        expectedGeneration: Long?,
        expectedLease: RequestLease?,
        apply: (PrivateData, T) -> PrivateData = { data, _ -> data },
        operation: suspend (StoredSession) -> T,
    ): T = coroutineScope {
        val owner = currentCoroutineContext().job
        val requestId = UUID.randomUUID()
        val (lease, saved) = gate.locked {
            expectedGeneration?.let { requireGeneration(it) }
            expectedLease?.let { requireLease(it) }
            if (snapshot.value.session !is SessionState.Authenticated) {
                throw ClientFailure(
                    FailureKind.Http,
                    401,
                )
            }
            val saved = credential ?: throw ClientFailure(FailureKind.Http, 401)
            if (saved.expiresAt.instant <= clock.instant()) {
                withContext(NonCancellable) { invalidate(owner) }
                throw ClientFailure(FailureKind.Http, 401)
            }
            val lease = lease(request)
            requests[requestId] = request.meetingId to owner
            lease to saved
        }
        try {
            val result = operation(saved)
            gate.locked {
                requireLease(lease)
                currentCoroutineContext().ensureActive()
                snapshot.value = snapshot.value.copy(data = apply(snapshot.value.data, result))
            }
            result
        } catch (error: ClientFailure) {
            withContext(NonCancellable) {
                gate.locked {
                    requireLease(lease)
                    if (error.status == 401) {
                        invalidate(owner)
                    } else if (error.status == 403 && request.revokesAccessOnForbidden) {
                        request.meetingId?.let { changeAccess(it, allowed = false, except = owner) }
                    }
                }
            }
            throw error
        } finally {
            withContext(NonCancellable) { gate.locked { requests.remove(requestId) } }
        }
    }

    suspend fun deleteAccount(cleanup: suspend (UUID) -> Unit = {}) = deletion.delete(cleanup)

    suspend fun leaveDeletion() = gate.locked { invalidate(null) }

    suspend fun logout() {
        val old = withContext(NonCancellable) {
            gate.locked {
                if (snapshot.value.session is SessionState.Deleting) {
                    throw ClientFailure(
                        FailureKind.StaleSession,
                    )
                }
                val old = credential
                invalidate(null)
                old
            }
        }
        old?.let { api.sendEmpty(SessionRequests.Logout, it) }
    }

    suspend fun meetingAccess(id: UUID): MeetingAccess = gate.locked {
        val profile = (snapshot.value.session as? SessionState.Authenticated)?.profile
            ?: throw ClientFailure(FailureKind.Http, 401)
        MeetingAccess(lease(ApiRequest(emptyList(), meetingId = id)), profile)
    }

    suspend fun <T> withAccess(access: MeetingAccess, block: suspend () -> T): T = gate.locked {
        requireLease(access.request)
        currentCoroutineContext().ensureActive()
        block()
    }

    suspend fun isCurrent(version: Long): Boolean = gate.locked {
        generation == version && credential != null
    }

    suspend fun updateAccess(id: UUID, allowed: Boolean, expectedGeneration: Long? = null) {
        gate.locked {
            expectedGeneration?.let { requireGeneration(it) }
            changeAccess(id, allowed)
        }
    }

    suspend fun beginData(update: (PrivateData) -> PrivateData): Long? = gate.locked {
        if (snapshot.value.session !is SessionState.Authenticated) return@locked null
        snapshot.value = snapshot.value.copy(data = update(snapshot.value.data))
        generation
    }

    suspend fun updateData(version: Long, update: (PrivateData) -> PrivateData) {
        gate.locked {
            if (generation == version && snapshot.value.session is SessionState.Authenticated) {
                snapshot.value = snapshot.value.copy(data = update(snapshot.value.data))
            }
        }
    }
}
