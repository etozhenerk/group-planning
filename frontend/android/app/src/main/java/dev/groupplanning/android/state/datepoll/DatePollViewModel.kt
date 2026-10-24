package dev.groupplanning.android.state.datepoll

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.requests.DatePollRequests
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive

internal class DatePollViewModel(
    private val repository: FeedRepository,
    private val access: MeetingAccess,
    scope: CoroutineScope,
    meeting: Meeting? = null,
) : ViewModel(scope) {
    private val mutable =
        MutableStateFlow(DatePollState(draft = meeting?.let(DatePollDraft::forMeeting)))
    val state = mutable.asStateFlow()
    private var stopped = false
    private var generation = 0

    suspend fun load(id: UUID) {
        if (stopped || state.value.loading || state.value.busy) return
        val version = generation
        mutable.value = state.value.copy(loading = true)
        try {
            val poll = repository.poll(access, DatePollRequests.read(access.id, id))
            if (generation == version) receive(poll)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: ClientFailure) {
            if (!stopped &&
                generation == version
            ) {
                mutable.value = state.value.copy(issue = DatePollIssue.Load)
            }
        } finally {
            if (!stopped && generation == version) mutable.value = state.value.copy(loading = false)
        }
    }

    fun reload(id: UUID) {
        viewModelScope.launch { load(id) }
    }

    fun choose(id: UUID) {
        val before = state.value
        val poll = before.poll ?: return
        if (!before.editable || !poll.canVote) return
        val selected = when {
            id in before.selected -> before.selected - id
            poll.settings.multipleAnswers -> before.selected + id
            else -> setOf(id)
        }
        mutable.value = before.copy(selected = selected, edited = true)
    }

    fun vote(clear: Boolean = false) {
        val ids = if (clear) emptySet() else state.value.selected
        action(
            "vote",
            mapOf(
                "option_ids" to
                    JsonArray(ids.sortedBy(UUID::toString).map { JsonPrimitive(it.toString()) }),
            ),
        )
    }

    fun action(kind: String, fields: Map<String, JsonElement>) {
        val poll = state.value.poll ?: return
        submit(DatePollRequests.action(poll, kind, fields))
    }

    fun change(transform: (DatePollDraft) -> DatePollDraft) {
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
        if (draft.dates.size !in 2..20 ||
            draft.dates.distinct().size != draft.dates.size ||
            draft.dates.any { runCatching { LocalDate.parse(it) }.isFailure }
        ) {
            mutable.value = state.value.copy(issue = DatePollIssue.Duplicate)
            return
        }
        val validation = draft.deadline.validate()
        if (validation.issue != null) {
            mutable.value = state.value.copy(validation = validation.issue.text)
            return
        }
        val deadline = validation.input?.startsAt
        if (deadline == null || !deadline.instant.isAfter(Instant.now())) {
            mutable.value = state.value.copy(issue = DatePollIssue.Deadline)
            return
        }
        submit(DatePollRequests.create(access.id, draft.dates, deadline.value, draft.settings))
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
                val poll = repository.poll(access, operation)
                if (stopped) return@launch
                mutable.value = state.value.copy(edited = false, pending = null)
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

    private fun receive(poll: DatePoll) {
        if (stopped) return
        val before = state.value
        mutable.value = before.copy(
            poll = poll,
            selected = if (before.edited) before.selected else poll.myOptionIds.toSet(),
            issue = before.issue.takeUnless { it == DatePollIssue.Load },
        )
    }

    fun stop() {
        stopped = true
        viewModelScope.cancel()
        mutable.value = DatePollState()
    }
}

private fun ClientFailure.pollIssue(): DatePollIssue = when {
    problem?.code == "date_poll_active" -> DatePollIssue.Active
    problem?.code == "date_poll_closed" -> DatePollIssue.Closed
    problem?.fieldErrors?.get("date") == "duplicate" -> DatePollIssue.Duplicate
    problem?.fieldErrors?.containsKey("closes_at") == true -> DatePollIssue.Deadline
    status == 409 -> DatePollIssue.Conflict
    status == 403 -> DatePollIssue.Forbidden
    status == 400 || status == 422 || status == 404 -> DatePollIssue.Rejected
    else -> DatePollIssue.Unconfirmed
}
