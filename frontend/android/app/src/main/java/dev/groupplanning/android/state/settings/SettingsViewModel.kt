package dev.groupplanning.android.state.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal class SettingsViewModel(
    initial: Meeting,
    private val repository: FeedRepository,
    private val access: MeetingAccess,
    scope: CoroutineScope,
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(SettingsState(initial))
    val state = mutable.asStateFlow()

    fun change(transform: (MeetingDraft) -> MeetingDraft) {
        if (state.value.editable) {
            mutable.value =
                state.value.copy(
                    draft = transform(state.value.draft),
                    validation = null,
                    issue = null,
                )
        }
    }

    fun preparingCover(value: Boolean) {
        mutable.value = state.value.copy(preparingCover = value)
    }

    fun reload() {
        if (state.value.busy) return
        mutable.value = state.value.copy(busy = true)
        viewModelScope.launch {
            try {
                val before = state.value
                val current = repository.details(access)
                mutable.value =
                    SettingsState(
                        current,
                        draft = rebaseSettings(
                            before.original.settingsDraft(),
                            before.draft,
                            current.settingsDraft(),
                        ),
                    )
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: ClientFailure) {
                mutable.value = state.value.copy(
                    issue = if (error.status == 403) {
                        SettingsIssue.Forbidden
                    } else {
                        state.value.issue?.takeIf {
                            it == SettingsIssue.Conflict || it == SettingsIssue.Forbidden
                        } ?: SettingsIssue.Load
                    },
                )
            } finally {
                mutable.value = state.value.copy(busy = false)
            }
        }
    }

    fun save() {
        val before = state.value
        if (before.busy ||
            before.preparingCover ||
            before.saved ||
            before.issue == SettingsIssue.Conflict ||
            before.issue == SettingsIssue.Forbidden ||
            !before.dirty
        ) {
            return
        }
        val validation = settingsPatch(before.original, before.draft)
        if (validation.issue != null) {
            mutable.value = before.copy(validation = validation.issue)
            return
        }
        val pending = before.pending ?: SettingsSubmission(validation.input ?: return)
        mutable.value = before.copy(busy = true, pending = pending, issue = null)
        viewModelScope.launch {
            try {
                val meeting = repository.save(access, pending.input, pending.key)
                mutable.value = SettingsState(meeting, saved = true)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: ClientFailure) {
                val issue = when (error.status) {
                    409 -> SettingsIssue.Conflict
                    403 -> SettingsIssue.Forbidden
                    400, 404, 422 -> SettingsIssue.Rejected
                    else -> SettingsIssue.Unconfirmed
                }
                mutable.value = state.value.copy(
                    issue = issue,
                    pending = pending.takeIf { issue == SettingsIssue.Unconfirmed },
                )
            } finally {
                mutable.value = state.value.copy(busy = false)
            }
        }
    }

    fun stop() {
        viewModelScope.cancel()
    }
}
