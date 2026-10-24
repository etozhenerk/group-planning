package dev.groupplanning.android.state.preparation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.RsvpAnswer
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

internal class PreparationFormViewModel(
    private val repository: FeedRepository,
    private val access: MeetingAccess,
    scope: CoroutineScope,
) : ViewModel(scope) {
    val operation = PreparationTaskViewModel(repository, access, scope)
    private val mutable = MutableStateFlow(PreparationFormState())
    val state = mutable.asStateFlow()
    val userId = access.profile.id
    private var stopped = false

    suspend fun loadPeople() {
        if (stopped || state.value.loading) return
        mutable.value = state.value.copy(loading = true)
        try {
            val people = repository.taskParticipants(access).filter {
                it.role == "organizer" ||
                    it.rsvp == RsvpAnswer.Going
            }
            if (!stopped) {
                mutable.value =
                    state.value.copy(participants = people, peopleError = false)
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: ClientFailure) {
            if (!stopped) mutable.value = state.value.copy(peopleError = true)
        } finally {
            if (!stopped) mutable.value = state.value.copy(loading = false)
        }
    }

    fun reloadPeople() {
        viewModelScope.launch { loadPeople() }
    }

    fun title(value: String) {
        if (operation.state.value.editable) {
            mutable.value =
                state.value.copy(title = value, validation = null)
        }
    }

    fun recipient(value: UUID?) {
        if (operation.state.value.editable) {
            mutable.value =
                state.value.copy(recipient = value, validation = null)
        }
    }

    fun create() {
        val pending = operation.state.value.pending
        if (pending != null) {
            operation.retry()
            return
        }
        if (!operation.state.value.editable || stopped) return
        val draft = state.value
        val people = draft.participants ?: return
        if (draft.peopleError) return
        val trimmed = draft.title.trim()
        if (trimmed.codePointCount(0, trimmed.length) !in 1..200) {
            mutable.value = draft.copy(validation = PreparationFormIssue.Title)
            return
        }
        if (draft.recipient != null && people.none { it.user.id == draft.recipient }) {
            mutable.value = draft.copy(validation = PreparationFormIssue.Recipient)
            return
        }
        viewModelScope.launch {
            operation.submit(PreparationTaskRequests.create(access.id, trimmed, draft.recipient))
            if (operation.state.value.issue == PreparationTaskIssue.Rejected) loadPeople()
        }
    }

    fun stop() {
        stopped = true
        operation.stop()
        viewModelScope.cancel()
        mutable.value = PreparationFormState()
    }
}
