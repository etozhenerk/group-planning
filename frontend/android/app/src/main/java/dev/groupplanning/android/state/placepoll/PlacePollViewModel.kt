package dev.groupplanning.android.state.placepoll

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.PlacePoll
import dev.groupplanning.android.data.api.requests.PlacePollRequests
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import java.time.Instant
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal class PlacePollViewModel(
    private val repository: FeedRepository,
    private val access: MeetingAccess,
    scope: CoroutineScope,
    meeting: Meeting? = null,
) : ViewModel(scope) {
    private val mutable =
        MutableStateFlow(PlacePollState(draft = meeting?.let(PlacePollDraft::forMeeting)))
    val state = mutable.asStateFlow()
    private var stopped = false
    private var generation = 0

    suspend fun load(id: UUID) {
        if (stopped || state.value.loading || state.value.busy) return
        val version = generation
        mutable.value = state.value.copy(loading = true)
        try {
            val poll = repository.placePoll(access, PlacePollRequests.read(access.id, id))
            if (generation == version) receive(poll)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: ClientFailure) {
            if (!stopped &&
                generation == version
            ) {
                mutable.value = state.value.copy(issue = PlacePollIssue.Load)
            }
        } finally {
            if (!stopped && generation == version) mutable.value = state.value.copy(loading = false)
        }
    }

    fun reload(id: UUID) {
        viewModelScope.launch { load(id) }
    }

    fun vote(answer: String) {
        val poll = state.value.poll ?: return
        if (!state.value.editable ||
            !poll.canVote ||
            !poll.closesAt.instant.isAfter(Instant.now()) ||
            answer !in listOf("for", "against")
        ) {
            return
        }
        mutable.value = state.value.copy(sendingAnswer = answer)
        submit(PlacePollRequests.vote(poll, answer))
    }

    fun change(transform: (PlacePollDraft) -> PlacePollDraft) {
        val draft = state.value.draft ?: return
        if (state.value.editable) {
            mutable.value =
                state.value.copy(draft = transform(draft), issue = null, validation = null)
        }
    }

    fun create() {
        state.value.pending?.let {
            submit(it)
            return
        }
        val draft = state.value.draft ?: return
        val place = draft.place.trim()
        if (place.codePointCount(0, place.length) !in 1..500) {
            mutable.value = state.value.copy(issue = PlacePollIssue.Place)
            return
        }
        val explanation = draft.explanation.trim()
        if (explanation.codePointCount(0, explanation.length) > 2000) {
            mutable.value = state.value.copy(issue = PlacePollIssue.Explanation)
            return
        }
        if (place == draft.previousPlace) {
            mutable.value = state.value.copy(issue = PlacePollIssue.Unchanged)
            return
        }
        val validation = draft.deadline.validate()
        if (validation.issue != null) {
            mutable.value = state.value.copy(validation = validation.issue.text)
            return
        }
        val deadline = validation.input?.startsAt
        if (deadline == null || !deadline.instant.isAfter(Instant.now())) {
            mutable.value = state.value.copy(issue = PlacePollIssue.Deadline)
            return
        }
        submit(PlacePollRequests.create(access.id, place, deadline.value, explanation))
    }

    fun retry() {
        state.value.pending?.let(::submit)
    }

    private fun submit(request: ApiRequest) {
        if (stopped || state.value.busy) return
        generation += 1
        val operation = state.value.pending ?: request
        mutable.value =
            state.value.copy(busy = true, loading = false, pending = operation, issue = null)
        viewModelScope.launch {
            try {
                val poll = repository.placePoll(access, operation)
                if (stopped) return@launch
                mutable.value = state.value.copy(pending = null)
                receive(poll)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: ClientFailure) {
                if (stopped) return@launch
                val definite = error.status?.let { it in 400..499 } == true
                if (definite && error.status == 409) {
                    mutable.value = state.value.copy(busy = false, pending = null)
                    state.value.poll?.id?.let { load(it) }
                }
                mutable.value = state.value.copy(
                    pending = operation.takeUnless { definite },
                    issue = error.pollIssue(),
                )
            } finally {
                if (!stopped) mutable.value = state.value.copy(busy = false)
            }
        }
    }

    fun receive(poll: PlacePoll) {
        if (stopped || state.value.poll?.revision?.let { it > poll.revision } == true) return
        val before = state.value
        mutable.value = before.copy(
            poll = poll,
            issue = before.issue.takeUnless { it == PlacePollIssue.Load },
        )
    }

    fun stop() {
        stopped = true
        viewModelScope.cancel()
        mutable.value = PlacePollState()
    }
}

private fun ClientFailure.pollIssue(): PlacePollIssue = when {
    problem?.code == "place_poll_active" -> PlacePollIssue.Active
    problem?.code == "place_poll_closed" -> PlacePollIssue.Closed
    problem?.fieldErrors?.get("place") == "unchanged" -> PlacePollIssue.Unchanged
    problem?.fieldErrors?.containsKey("place") == true -> PlacePollIssue.Place
    problem?.fieldErrors?.containsKey("closes_at") == true -> PlacePollIssue.Deadline
    status == 409 -> PlacePollIssue.Conflict
    status == 403 -> PlacePollIssue.Forbidden
    status == 400 || status == 422 || status == 404 -> PlacePollIssue.Rejected
    else -> PlacePollIssue.Unconfirmed
}
