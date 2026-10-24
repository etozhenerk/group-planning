package dev.groupplanning.android.state.preparation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.data.api.models.PreparationTask
import dev.groupplanning.android.data.api.requests.PreparationTaskRequests
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal class PreparationTaskViewModel(
    private val repository: FeedRepository,
    private val access: MeetingAccess,
    scope: CoroutineScope,
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(PreparationTaskState())
    val state = mutable.asStateFlow()
    val userId = access.profile.id
    private var stopped = false
    private var generation = 0

    suspend fun load(id: UUID) {
        if (stopped || state.value.loading || state.value.busy) return
        val version = generation
        mutable.value = state.value.copy(loading = true)
        try {
            val task = repository.preparationTask(
                access,
                PreparationTaskRequests.read(access.id, id),
            )
            if (task.id !=
                id
            ) {
                throw ClientFailure(
                    FailureKind.InvalidResponse,
                )
            }
            if (generation == version) receive(task)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: ClientFailure) {
            if (!stopped &&
                generation == version
            ) {
                mutable.value =
                    state.value.copy(issue = PreparationTaskIssue.Load)
            }
        } finally {
            if (!stopped && generation == version) mutable.value = state.value.copy(loading = false)
        }
    }

    fun reload(id: UUID) {
        viewModelScope.launch { load(id) }
    }

    fun act(action: PreparationAction) {
        val task = state.value.task ?: return
        if (!state.value.editable || !action.allowed(task)) return
        mutable.value = state.value.copy(sendingAction = action)
        viewModelScope.launch { submit(PreparationTaskRequests.act(task, action)) }
    }

    fun retry() {
        state.value.pending?.let { request -> viewModelScope.launch { submit(request) } }
    }

    suspend fun submit(request: ApiRequest) {
        if (stopped || state.value.busy) return
        generation += 1
        val operation = state.value.pending ?: request
        mutable.value =
            state.value.copy(busy = true, loading = false, pending = operation, issue = null)
        try {
            val task = repository.preparationTask(access, operation)
            if (stopped) return
            if (state.value.task?.id?.let { it != task.id } == true) {
                throw ClientFailure(FailureKind.InvalidResponse)
            }
            mutable.value = state.value.copy(pending = null)
            receive(task)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: ClientFailure) {
            if (stopped) return
            val definite = error.status?.let { it in 400..499 } == true
            if (definite && error.status == 409) {
                mutable.value = state.value.copy(busy = false, pending = null)
                state.value.task?.id?.let { load(it) }
            }
            mutable.value =
                state.value.copy(
                    pending = operation.takeUnless { definite },
                    issue = when {
                        error.status == 409 -> PreparationTaskIssue.Conflict
                        error.status == 403 -> PreparationTaskIssue.Forbidden
                        definite -> PreparationTaskIssue.Rejected
                        else -> PreparationTaskIssue.Unconfirmed
                    },
                )
        } finally {
            if (!stopped) mutable.value = state.value.copy(busy = false)
        }
    }

    private fun receive(task: PreparationTask) {
        if (stopped) return
        mutable.value =
            state.value.copy(
                task = task,
                issue = state.value.issue.takeUnless {
                    it ==
                        PreparationTaskIssue.Load
                },
            )
    }

    fun stop() {
        stopped = true
        viewModelScope.cancel()
        mutable.value = PreparationTaskState()
    }
}
