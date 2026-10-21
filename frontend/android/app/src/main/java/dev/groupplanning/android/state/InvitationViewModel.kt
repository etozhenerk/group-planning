package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.RsvpRequest
import dev.groupplanning.android.data.links.InvitationTarget
import dev.groupplanning.android.data.repository.InvitationDetails
import dev.groupplanning.android.data.repository.InvitationRepository
import dev.groupplanning.android.data.session.SessionState
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

internal class InvitationViewModel(
    val target: InvitationTarget,
    private val repository: InvitationRepository,
    scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate),
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(InvitationState())
    val state = mutable.asStateFlow()
    val snapshot = repository.snapshot
    private var operation: Job? = null
    private var epoch = 0L

    init {
        viewModelScope.launch {
            snapshot.map { it.session }.distinctUntilChanged().collect { session ->
                suspend()
                mutable.value = InvitationState()
                if (session !is SessionState.Restoring) reload()
            }
        }
    }

    fun choose(answer: RsvpAnswer) {
        if (state.value.editable) mutable.value = state.value.copy(choice = answer, issue = null)
    }

    fun reload() {
        startReload(preserveChoice = false)
    }

    private fun startReload(preserveChoice: Boolean) {
        if (state.value.saving) return
        suspend()
        val version = epoch
        operation = viewModelScope.launch { load(version, preserveChoice) }
    }

    fun refreshIfIdle() {
        if (operation?.isActive != true && state.value.pending == null) {
            startReload(preserveChoice = true)
        }
    }

    private suspend fun load(version: Long, preserveChoice: Boolean = false) {
        val draft = state.value.choice.takeIf { preserveChoice && it != state.value.answer }
        mutable.value = state.value.copy(loading = true, issue = null)
        try {
            val details = repository.load(target, state.value.details?.preview)
            if (epoch != version) return
            mutable.value = InvitationState(
                details = details,
                choice = draft ?: details.preview.myRsvp,
                loading = true,
                profileId = (snapshot.value.session as? SessionState.Authenticated)?.profile?.id,
                shareUrl = state.value.shareUrl.takeIf { details.organizer },
            )
            if (details.canAccess) {
                repository.loadPrivate(details.preview.meetingId)
                if (details.organizer) loadShare(details)
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: ClientFailure) {
            if (epoch == version) {
                val unavailable = error.status == 404
                mutable.value = state.value.copy(
                    details = if (unavailable) null else state.value.details,
                    issue = if (unavailable) InvitationIssue.Unavailable else InvitationIssue.Load,
                )
            }
        } finally {
            if (epoch == version) mutable.value = state.value.copy(loading = false)
        }
    }

    fun save() {
        val before = state.value
        if (before.loading || before.saving || (!before.canSave && before.pending == null)) return
        val profile = (snapshot.value.session as? SessionState.Authenticated)?.profile ?: return
        if (before.profileId != profile.id) return
        val details = before.details ?: return
        val pending = before.pending ?: RsvpSubmission(
            RsvpRequest(
                before.choice ?: return,
                details.preview.myRsvpRevision,
            ),
        )
        suspend()
        val version = epoch
        mutable.value = before.copy(pending = pending, saving = true, issue = null)
        operation = viewModelScope.launch {
            try {
                val result = repository.respond(
                    target,
                    details.preview.meetingId,
                    pending.input,
                    pending.key,
                )
                if (epoch != version) return@launch
                mutable.value = state.value.copy(
                    details = InvitationDetails(
                        details.preview.copy(
                            myRsvp = result.rsvp,
                            myRsvpRevision = result.rsvpRevision,
                        ),
                    ),
                    choice = result.rsvp,
                    pending = null,
                    saving = false,
                )
                if (result.canAccessFeed) load(version)
                repository.refreshList()
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: ClientFailure) {
                if (epoch == version) handleFailure(error, version)
            } finally {
                if (epoch == version) mutable.value = state.value.copy(saving = false)
            }
        }
    }

    private suspend fun handleFailure(error: ClientFailure, version: Long) {
        when (error.status) {
            409 -> {
                mutable.value = state.value.copy(saving = false, pending = null)
                load(version)
                if (epoch == version) {
                    mutable.value = state.value.copy(issue = InvitationIssue.Conflict)
                }
            }
            400, 403, 404, 422 -> mutable.value = state.value.copy(
                pending = null,
                issue = InvitationIssue.Rejected,
            )
            else -> mutable.value = state.value.copy(issue = InvitationIssue.Unconfirmed)
        }
    }

    private suspend fun loadShare(details: InvitationDetails) {
        try {
            val url = repository.share(details.preview.meetingId)
            mutable.value = state.value.copy(shareUrl = url)
        } catch (_: ClientFailure) {
            mutable.value = state.value.copy(issue = InvitationIssue.Share)
        }
    }

    fun suspend() {
        epoch += 1
        operation?.cancel()
        operation = null
        mutable.value = state.value.copy(loading = false, saving = false)
    }

    fun stop() {
        viewModelScope.cancel()
    }
}
