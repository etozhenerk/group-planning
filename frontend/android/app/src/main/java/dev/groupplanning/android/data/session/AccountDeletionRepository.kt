package dev.groupplanning.android.data.session

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.auth.AuthProof
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.job
import kotlinx.coroutines.withContext

internal class AccountDeletionRepository(
    private val gate: SessionGate,
    private val api: ApiClient,
) {
    suspend fun delete(cleanup: suspend (UUID) -> Unit) {
        val owner = currentCoroutineContext().job
        val operation = gate.locked {
            if ((snapshot.value.session as? SessionState.Deleting)?.busy == true) return@locked null
            val saved = credential ?: throw ClientFailure(FailureKind.Http, 401)
            val pending = saved.deletion ?: PendingAccountDeletion(
                AuthProof.generate().verifier,
                (snapshot.value.session as? SessionState.Authenticated)?.profile?.id
                    ?: throw ClientFailure(FailureKind.Http, 401),
            )
            val candidate = StoredSession(saved.token, saved.expiresAt, pending)
            storage { save(candidate) }
            reset(owner)
            credential = candidate
            snapshot.value =
                ClientSnapshot(SessionState.Deleting(busy = true), generation = generation)
            candidate to generation
        } ?: return
        val (candidate, version) = operation
        try {
            val pending = checkNotNull(candidate.deletion)
            api.sendEmpty(
                ApiRequest(
                    listOf("me"),
                    method = "DELETE",
                    deletionToken = pending.token,
                    expectedStatus = 204,
                ),
                candidate,
            )
            gate.locked { requireGeneration(version) }
            cleanup(pending.userId)
            gate.locked {
                requireGeneration(version)
                withContext(NonCancellable) { finishAccountDeletion(owner) }
                snapshot.value = ClientSnapshot(SessionState.Deleted, generation = generation)
            }
        } catch (cancelled: CancellationException) {
            withContext(NonCancellable) {
                gate.locked {
                    if (generation == version) {
                        snapshot.value =
                            ClientSnapshot(SessionState.Deleting(), generation = generation)
                    }
                }
            }
            throw cancelled
        } catch (failure: ClientFailure) {
            withContext(NonCancellable) {
                gate.locked {
                    if (generation == version) {
                        snapshot.value =
                            ClientSnapshot(
                                SessionState.Deleting(error = failure),
                                generation = generation,
                            )
                    }
                }
            }
            throw failure
        }
    }
}
