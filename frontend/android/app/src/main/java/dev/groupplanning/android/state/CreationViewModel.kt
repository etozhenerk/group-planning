package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.data.api.requests.MeetingRequests
import dev.groupplanning.android.data.drafts.DraftIssue
import dev.groupplanning.android.data.drafts.DraftRecord
import dev.groupplanning.android.data.drafts.DraftRepository
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.data.session.SessionRepository
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal class CreationViewModel(
    owner: UUID,
    private val session: SessionRepository,
    private val drafts: DraftRepository,
    timezone: String = ZoneId.systemDefault().id,
    scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate),
    private val initialDay: LocalDate? = null,
) : ViewModel(scope) {
    private val mutable =
        MutableStateFlow(CreationState(DraftRecord(owner, MeetingDraft(timezone))))
    val state = mutable.asStateFlow()
    private var sessionLease: Long? = null
    private var draftLease: UUID? = null
    private var persistence: Job? = null
    private var operation: Job? = null

    fun load() {
        if (state.value.ready || operation?.isActive == true) return
        operation = viewModelScope.launch {
            try {
                sessionLease = session.beginData { it } ?: return@launch
                val (lease, record) = drafts.open(state.value.record.owner)
                if (!current()) return@launch
                draftLease = lease
                var restored = record ?: state.value.record
                if (initialDay != null && restored.submission == null) {
                    restored = restored.copy(
                        value = restored.value.copy(day = initialDay.toString(), repetition = null),
                        requestId = UUID.randomUUID(),
                    )
                    drafts.save(restored, lease)
                }
                mutable.value = state.value.copy(
                    record = restored,
                    ready = true,
                    problem = if (record?.submission != null) PENDING_TEXT else null,
                )
            } catch (_: ClientFailure) {
                mutable.value = state.value.copy(problem = "Не удалось открыть черновик.")
            }
        }
    }

    fun change(update: (MeetingDraft) -> MeetingDraft) {
        val before = state.value
        if (!before.editable) return
        var value = update(before.record.value)
        if (value.day != before.record.value.day || value.time != before.record.value.time) {
            value = value.copy(repetition = null)
        }
        val record = before.record.copy(value = value, requestId = UUID.randomUUID())
        mutable.value =
            before.copy(record = record, problem = null, warning = null, ambiguous = false)
        persistence?.cancel()
        persistence = viewModelScope.launch {
            delay(150)
            try {
                draftLease?.let { if (current()) drafts.save(record, it) }
            } catch (_: ClientFailure) {
                if (state.value.record == record) {
                    mutable.value =
                        state.value.copy(warning = "Черновик не сохранился на устройстве.")
                }
            }
        }
    }

    fun submit() {
        if (!state.value.ready || state.value.busy || operation?.isActive == true) return
        mutable.value = state.value.copy(busy = true, problem = null)
        persistence?.cancel()
        operation = viewModelScope.launch { performSubmit() }
    }

    private suspend fun performSubmit() {
        var sent = false
        try {
            val lease = draftLease ?: return
            if (!current()) return
            var record = state.value.record
            if (record.submission == null) {
                val checked = record.value.validate()
                if (checked.issue != null) {
                    mutable.value = state.value.copy(
                        problem = checked.issue.text,
                        ambiguous = checked.issue == DraftIssue.Ambiguous,
                    )
                    return
                }
                record = record.copy(submission = checked.input)
                mutable.value = state.value.copy(record = record)
            }
            drafts.save(record, lease)
            if (!current()) return
            sent = true
            val result = session.authenticated(
                MeetingRequests.create(checkNotNull(record.submission), record.requestId),
                CreatedMeeting.serializer(),
                expectedGeneration = sessionLease,
            )
            drafts.remove(record.owner, lease)
            if (current()) mutable.value = state.value.copy(created = result)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: ClientFailure) {
            if (current()) {
                val definite = !sent || error.status in setOf(400, 403, 409, 422)
                val record = if (definite) {
                    state.value.record.copy(submission = null)
                } else {
                    state.value.record
                }
                if (definite) {
                    try {
                        draftLease?.let { drafts.save(record, it) }
                    } catch (_: ClientFailure) {
                        mutable.value = state.value.copy(
                            warning = "Черновик не сохранился на устройстве.",
                        )
                    }
                }
                mutable.value = state.value.copy(
                    record = record,
                    problem = if (definite) {
                        "Не удалось сохранить встречу. Проверьте поля и повторите."
                    } else {
                        PENDING_TEXT
                    },
                )
            }
        } finally {
            mutable.value = state.value.copy(busy = false)
        }
    }

    fun saveAndClose() {
        if (state.value.busy || operation?.isActive == true) return
        persistence?.cancel()
        operation = viewModelScope.launch {
            try {
                val lease = draftLease ?: return@launch
                if (!current()) return@launch
                drafts.save(state.value.record, lease)
                mutable.value = state.value.copy(closed = true)
            } catch (_: ClientFailure) {
                mutable.value =
                    state.value.copy(problem = "Не удалось сохранить черновик. Повторите.")
            }
        }
    }

    fun stop() {
        viewModelScope.cancel()
    }

    private suspend fun current(): Boolean = sessionLease?.let { session.isCurrent(it) } == true

    private companion object {
        const val PENDING_TEXT =
            "Результат сохранения не подтверждён. Повторите запрос с теми же данными."
    }
}
